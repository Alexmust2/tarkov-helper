<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <span class="close-btn" @click="closeModal">×</span>
      <div class="modal-content">
        <div class="task-image-container">
          <img :src="task.taskImageLink" alt="Task Image" class="task-image" />
          <div v-if="countableObjectives.length && counters.length" class="task-counters">
            <div v-for="(objective, index) in countableObjectives" :key="index" class="task-counter">
              <div v-if="objective.items">
                <img :src="objective.items[0].iconLink" :alt="objective.items[0].name" class="counter-image" />
              </div>
              <div v-else class="default-image"></div>              <span style="font-size: 15px">{{objective.description}}</span>
              <div class="counter-controls">
                <button @click="decrementCounter(index)">-</button>
                <span>{{ counters[index] }} из {{ objective.count }}</span>
                <button @click="incrementCounter(index)">+</button>
              </div>
            </div>
          </div>
        </div>
        <div class="task-details">
          <h2 class="task-name">{{ task.name }}</h2>
          <div class="task-info">
            <div class="task-info-item">
              <strong>Опыт:</strong> <span>{{ task.experience }}</span>
            </div>
            <div class="task-info-item">
              <strong>Минимальный уровень игрока:</strong> <span>{{ task.minPlayerLevel }}</span>
            </div>
            <div class="task-info-item">
              <strong>Требуется для Kappa:</strong> <span>{{ task.kappaRequired ? 'Да' : 'Нет' }}</span>
            </div>
            <div class="task-info-item">
              <strong>Торговец:</strong> <span>{{ task.trader.name }}</span>
            </div>
          </div>
          <div v-if="task.taskRequirements.length" class="task-requirements">
            <div class="task-info-item">
              <strong>Требуемые задачи:</strong>
              <ul>
                <li v-for="requirement in task.taskRequirements" :key="requirement.task.id">
                  {{ requirement.task.name }}
                </li>
              </ul>
            </div>
          </div>
          <div v-if="task.objectives.length" class="task-objectives">
            <div class="task-info-item">
              <strong>Цели задачи:</strong>
              <div v-for="(objective, index) in task.objectives" :key="index">
                <div>
                  <span @click="toggleObjectiveStatus(index)">{{ objective.completed ? '✅' : '❌' }}</span>
                  {{ objective.description || 'Описание отсутствует' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
export default {
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      counters: [],
      user: null,
    };
  },
  computed: {
    countableObjectives() {
      return this.task && Array.isArray(this.task.objectives)
          ? this.task.objectives.filter(objective => objective.count && objective.type !== 'findItem')
          : [];
    }
  },
  mounted() {
    this.initializeCounters();
    this.user = atob(localStorage.getItem('authUser'));
    this.loadUserData();
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    initializeCounters() {
      if (this.countableObjectives.length > 0) {
        this.counters = this.countableObjectives.map(() => 0);
      } else {
        this.counters = [];
      }
    },
    toggleObjectiveStatus(index) {
      const objective = this.task.objectives[index];
      objective.completed = !objective.completed;
      this.saveObjectiveStatusToFirebase(index);
      this.checkTaskCompletion();
    },

    incrementCounter(index) {
      if (this.counters[index] < this.countableObjectives[index].count) {
        this.counters[index]++;
        this.saveCounterToFirebase(index);
        this.checkTaskCompletion();
      }
    },

    decrementCounter(index) {
      if (this.counters[index] > 0) {
        this.counters[index]--;
        this.saveCounterToFirebase(index);
        this.checkTaskCompletion();
      }
    },
    async saveCounterToFirebase(index) {
      if (this.user) {
        const userRef = doc(db, 'users', this.user);
        const countableObjective = this.countableObjectives[index];
        const userDoc = await getDoc(userRef);

        let counters = [];
        if (userDoc.exists() && userDoc.data().counters) {
          counters = userDoc.data().counters;
        }

        const updatedCounters = counters.filter(counter => counter.taskId !== this.task.id || counter.objectiveId !== countableObjective.id);
        updatedCounters.push({
          taskId: this.task.id,
          objectiveId: countableObjective.id,
          count: this.counters[index],
        });

        await setDoc(userRef, { counters: updatedCounters }, { merge: true });
      }
    },
    async saveObjectiveStatusToFirebase(index) {
      if (this.user) {
        const userRef = doc(db, 'users', this.user);
        const objective = this.task.objectives[index];
        const userDoc = await getDoc(userRef);

        let objectives = [];
        if (userDoc.exists() && userDoc.data().objectives) {
          objectives = userDoc.data().objectives;
        }

        const updatedObjectives = objectives.filter(obj => obj.taskId !== this.task.id || obj.objectiveId !== objective.id);
        updatedObjectives.push({
          taskId: this.task.id,
          objectiveId: objective.id,
          completed: objective.completed,
        });

        await setDoc(userRef, { objectives: updatedObjectives }, { merge: true });
      }
    },
    loadUserData() {
      if (this.user) {
        const userRef = doc(db, 'users', this.user);

        // Set up a snapshot listener to get real-time updates
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            this.loadCountersFromFirebase(userData.counters);
            this.loadObjectivesFromFirebase(userData.objectives);
          } else {
            console.error("User document does not exist");
          }
        }, (error) => {
          console.error("Error fetching user data: ", error);
        });
      }
    },
    loadCountersFromFirebase(counters) {
      if (counters) {
        const taskCounters = counters.filter((counter) => counter.taskId === this.task.id);
        this.counters = this.countableObjectives.map((objective) => {
          const counterData = taskCounters.find((counter) => counter.objectiveId === objective.id);
          return counterData ? counterData.count : 0;
        });
      }
    },
    loadObjectivesFromFirebase(objectives) {
      if (objectives) {
        const taskObjectives = objectives.filter((objective) => objective.taskId === this.task.id);
        this.task.objectives.forEach((objective) => {
          const objectiveData = taskObjectives.find((obj) => obj.objectiveId === objective.id);
          console.log(objectiveData)
          if (objectiveData) {
            objective.completed = objectiveData.completed;
          }
        });
      }
    },
    checkTaskCompletion() {
      const objectivesCompleted = this.task.objectives.every(objective => objective.completed);
      const countersMatch = this.counters.every((count, index) => count === this.countableObjectives[index].count);

      if (objectivesCompleted && countersMatch) {
        this.addToCompletedTasks();
      } else {
        this.removeFromCompletedTasks();
      }
    },
    async addToCompletedTasks() {
      if (this.user) {
        const userRef = doc(db, 'users', this.user);
        const userDoc = await getDoc(userRef);

        let completedTasks = [];
        if (userDoc.exists() && userDoc.data().completedTasks) {
          completedTasks = [...userDoc.data().completedTasks];
        }
        this.$emit('complete', this.task.id);

        const updatedCompletedTasks = [...new Set([...completedTasks, this.task.id])];

        await setDoc(userRef, { completedTasks: updatedCompletedTasks}, { merge: true });
      }
    },

    async removeFromCompletedTasks() {
      if (this.user) {
        const userRef = doc(db, 'users', this.user);
        const userDoc = await getDoc(userRef);

        let completedTasks = [];
        if (userDoc.exists() && userDoc.data().completedTasks) {
          completedTasks = [...userDoc.data().completedTasks];
        }

        const updatedCompletedTasks = completedTasks.filter(taskId => taskId !== this.task.id);
        this.$emit('remove', this.task.id);

        await setDoc(userRef, { completedTasks: updatedCompletedTasks }, { merge: true });
      }
    }
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal {
  background-color: #fff;
  width: 80%;
  max-width: 800px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}
.default-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #ff0000;
}

.modal-content {
  display: flex;
  flex-direction: row;
  padding: 20px;
}

.task-image-container {
  flex: 0 0 40%;
  margin-right: 20px;
}

.task-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.task-counters {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  flex-wrap: wrap;
  max-height: 500px;
  overflow-y: auto;
}

.task-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  width: 50%;
}

.counter-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.counter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.counter-controls button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.counter-controls button:hover {
  background-color: #0056b3;
}

.task-details {
  flex: 1;
  text-align: left;
}

.task-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.task-info-item {
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.task-info-item strong {
  margin-bottom: 5px;
}

.task-requirements,
.task-objectives {
  margin-bottom: 20px;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 10px;

}

h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
}

li {
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .modal-content {
    flex-direction: column;
  }

  .task-image-container {
    flex: 0 0 auto;
    margin-right: 0;
    margin-bottom: 20px;
  }
}
</style>
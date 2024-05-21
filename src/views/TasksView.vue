<template>
  <div class="trader-buttons">
    <TraderButton
      v-for="trader in tradersWithTasks"
      :key="trader.name"
      :trader="trader"
      @filter="filterTasks"
      class="trader-button"
    >
      <h5>{{ trader.name }}</h5>
    </TraderButton>
    <button @click="filterTasks(null)" class="trader-button reset">
      <h5>Все торговцы</h5>
    </button>
  </div>
  <div class="search-and-interaction">
    <input type="text" v-model="searchTerm" placeholder="Поиск..." class="search-input" />
    <div class="task-interaction">
      <select v-on:change="funcSortBy($event.target.value)" class="custom-select">
        <option v-for="option in selectOptions" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button @click="deleteProgress()" class="reset-progress-btn">
        Сбросить прогресс
      </button>
      <h3>Выполнено {{ funcCompletedTasks.length }}/{{ filteredTasks.length }}</h3>
    </div>
  </div>
  <div class="quest-card-list">
    <li
      v-for="task in filteredSortedTasks"
      :key="task.id"
      class="quest-card-item"
      @click="showModal(task)"
    >
      <TaskItem
         @click="showModal(task)"
        :task="task"
        :kappaRequired="task.kappaRequired"
        :isTaskCompleted="isTaskCompleted"
        :markTaskCompleted="markTaskCompleted"
        :completedTasks="completedTasks"
      />
    </li>
    <TaskModal v-if="selectedTask" :task="selectedTask" @close="hideModal" @complete="finishedTask" @remove="removeTask"/>
  </div>
</template>

<script>
import TraderButton from "../components/TraderButton.vue";
import TaskItem from "../components/TaskCard.vue";
import TaskModal from "../components/TaskModal.vue";
import { request, gql } from "graphql-request";
import { db } from "@/firebase";
import { decode } from "js-base64";
import { doc, getDoc, setDoc } from "firebase/firestore";
export default {
  components: {
    TraderButton,
    TaskItem,
    TaskModal
  },
  data() {
    return {
      tasks: [],
      traders: [],
      selectedTrader: null,
      completedTasks: [],
      sortBy: "none",
      selectedTask: null,
      selectOptions: [
        { label: "По умолчанию", value: "none" },
        { label: "Не выполненные", value: "incomplete" },
        { label: "Выполненные", value: "completed" },
        { label: "Не нужно для каппы", value: "notKappa" },
        { label: "Нужно для каппы", value: "kappa" },
      ],
      searchTerm: "",
    };
  },
  async mounted() {
    const query = gql`
  {
    tasks(lang: ru) {
      id
      name
      experience
      minPlayerLevel
      kappaRequired
      taskImageLink
      trader {
        id
        name
      }
      taskRequirements {
        task {
          id
          name
        }
      }
      objectives {
        id
        optional
        description
        type
        ... on TaskObjectiveItem {
          items {
            name
            id
            iconLink
          }
          count
        }
        ... on TaskObjectiveBasic {
          description
        }
        ... on TaskObjectiveBuildItem {
          description
        }
        ... on TaskObjectiveExperience {
          description
          count
        }
        ... on TaskObjectiveExtract {
          exitName
          count
          description
        }
        ... on TaskObjectiveMark {
          description
        }
        ... on TaskObjectivePlayerLevel {
          description
        }
        ... on TaskObjectiveQuestItem {
          description
          count
        }
        ... on TaskObjectiveShoot {
          description
          count
        }
        ... on TaskObjectiveSkill {
          description
        }
        ... on TaskObjectiveTaskStatus {
          description
        }
        ... on TaskObjectiveTraderLevel {
          description
        }
        ... on TaskObjectiveTraderStanding {
          description
        }
        ... on TaskObjectiveUseItem {
          description
          count
        }
      }
    }
    traders(lang: ru) {
      id
      name
      imageLink
    }
  }
`;

    request("https://api.tarkov.dev/graphql", query).then((data) => {
      this.tasks = data.tasks;
      this.traders = data.traders;
      this.getUserCompletedTasks().then((completedTasks) => {
        this.completedTasks = completedTasks;
      });
    });
  },
  computed: {
    filteredTasks() {
      if (!this.selectedTrader) return this.tasks;
      return this.tasks.filter((task) => task.trader.id === this.selectedTrader);
    },
    getUserCompletedTasks() {
      return async () => {
        let username = localStorage.getItem("authUser");
        const userRef = doc(db, "users", decode(username));
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          return userDoc.data().completedTasks || [];
        } else {
          return [];
        }
      };
    },
    filteredSortedTasks() {
      return this.sortedTasks.filter((task) =>
        task.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    },
    funcCompletedTasks() {
      return this.filteredTasks.filter((task) => this.isTaskCompleted(task.id));
    },
    tradersWithTasks() {
      return this.traders.filter((trader) =>
        this.tasks.some((task) => task.trader.id === trader.id)
      );
    },
    sortedTasks() {
      let sorted = [...this.filteredTasks];
      switch (this.sortBy) {
        case "kappa":
          sorted.sort((a, b) => b.kappaRequired - a.kappaRequired);
          break;
        case "notKappa":
          sorted.sort((a, b) => a.kappaRequired - b.kappaRequired);
          break;
        case "experience":
          sorted.sort((a, b) => a.experience - b.experience);
          break;
        case "completed":
          sorted = sorted.filter((task) => this.isTaskCompleted(task.id));
          break;
        case "incomplete":
          sorted = sorted.filter((task) => !this.isTaskCompleted(task.id));
          break;
        default:
          break;
      }
      if (this.selectedTrader) {
        sorted = sorted.filter((task) => task.trader.id === this.selectedTrader);
      }
      return sorted;
    },
  },
  methods: {
    showModal(task) {
      this.selectedTask = task;
      console.log(this.selectedTask )
    },
    hideModal() {
      this.selectedTask = null;
    },
    deleteProgress() {
      localStorage.removeItem("completedTasks");
      window.location.reload();
    },

    async markTaskCompleted(taskId) {
      const task = this.tasks.find(task => task.id === taskId);

      if (!task) {
        console.error(`Task with id ${taskId} not found`);
        return;
      }

      if (!this.completedTasks.includes(taskId)) {
        this.completedTasks.push(taskId);
        localStorage.setItem("completedTasks", JSON.stringify(this.completedTasks));

        let username = localStorage.getItem("authUser");
        if (!username) {
          console.error("No authenticated user found");
          return;
        }
        username = decode(username);

        const userRef = doc(db, "users", username);

        const userDoc = await getDoc(userRef);
        let objectives = [];
        let counters = [];

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.objectives) {
            objectives = userData.objectives;
          }
          if (userData.counters) {
            counters = userData.counters;
          }
        }

        task.objectives.forEach(objective => {
          const updatedObjectives = objectives.filter(obj => obj.taskId !== taskId || obj.objectiveId !== objective.id);
          updatedObjectives.push({
            taskId: taskId,
            objectiveId: objective.id,
            completed: true,
          });
          objectives = updatedObjectives;
        });

        const countableObjectives = task.objectives.filter(objective => objective.count && objective.type !== 'findItem');
        countableObjectives.forEach(countableObjective => {
          const updatedCounter = counters.find(counter => counter.taskId === taskId && counter.objectiveId === countableObjective.id);
          if (updatedCounter) {
            updatedCounter.count = countableObjective.count;
          } else {
            counters.push({
              taskId: taskId,
              objectiveId: countableObjective.id,
              count: countableObjective.count,
            });
          }
        });

        await setDoc(userRef, { completedTasks: this.completedTasks }, { merge: true });
        await setDoc(userRef, { objectives: objectives }, { merge: true });
        await setDoc(userRef, { counters: counters }, { merge: true });
      }
    },

    isTaskCompleted(taskId) {
      return this.completedTasks.includes(taskId);
    },
    filterTasks(traderName) {
      this.selectedTrader = traderName;
    },
    funcSortBy(value) {
      this.sortBy = value;
    },
    finishedTask(taskId) {
      this.completedTasks.push(taskId);
    },
    removeTask(taskId) {
      const index = this.completedTasks.indexOf(taskId);
      if (index !== -1) {
        this.completedTasks.splice(index, 1);
      }
    },
  },
};
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f4f4f8;
  color: #333;
}

.trader-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}

h3 {
  color: white;
  margin-top: 25px;
}

.trader-button {
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.trader-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.trader-button.reset {
  background: #ff6b6b;
  color: white;
}

.reset-progress-btn {
  margin-left: 15px;
}

.search-and-interaction {
  display: flex;
  justify-content: space-around;
  padding: 20px;
}

.search-input {
  width: 300px;
  height: 50px;
  padding: 10px;
  border: 2px solid #ccc;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #0056b3;
}

.custom-select {
  width: 200px;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #ccc;
  appearance: none;

  cursor: pointer;
}

.custom-select:hover {
  border-color: #888;
}

.reset-progress-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.reset-progress-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.quest-card-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  list-style: none;
  padding: 0;
  margin: 20px auto;
}

.quest-card-item {
  width: 300px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.quest-card-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .quest-card-item {
    width: calc(50% - 20px);
  }
}

@media (max-width: 480px) {
  .quest-card-item {
    width: calc(100% - 20px);
  }
}
</style>

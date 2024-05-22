<template>
  <div
      class="quest-card"
      :style="{ backgroundColor: isTaskCompleted(task.id) ? 'lightgreen' : 'white' }"
  >
    <div
        class="quest-image"
        :style="{ backgroundImage: 'url(' + task.taskImageLink + ')' }"
    >
      <div v-if="task.kappaRequired" class="kappa-icon"></div>
    </div>
    <div class="quest-name">{{ task.name }}</div>
    <div class="quest-actions">
      <button
          @click="toggleTaskCompletion"
          @click.stop
          :class="['quest-button', { completed: isTaskCompleted(task.id) }]"
      >
        {{ isTaskCompleted(task.id) ? "Отменить" : "Выполнить" }}
      </button>
<!--      <button @click="showRewardsModal" @click.stop class="quest-button">Награды</button>-->
    </div>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>Награды за выполнение задачи "{{ task.name }}"</h2>
        <div v-for="reward in rewards.traderStanding" :key="reward.trader.name">
          <h3>{{ reward.trader.name }}</h3>
          <img :src="reward.trader.imageLink" alt="Trader Image" style="max-width: 100px;">
          <p>Статус: {{ reward.standing }}</p>
        </div>
        <div v-for="item in rewards.items" :key="item.item.id">
          <img :src="item.item.iconLink" alt="Item Icon" style="max-width: 50px;">
          <p>{{ item.item.name }}: {{ item.count }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { decode } from "js-base64";
import {gql, request} from "graphql-request";

export default {
  props: {
    task: {
      type: Object,
      required: true,
    },
    isTaskCompleted: {
      type: Function,
      required: true,
    },
    markTaskCompleted: {
      type: Function,
      required: true,
    },
    completedTasks: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      showModal: false,
      rewards: [],
    };
  },
  methods: {
    async toggleTaskCompletion() {
      if (!this.isTaskCompleted(this.task.id)) {
        await this.markTaskCompleted(this.task.id);
      } else {
        const taskId = this.task.id;
        const index = this.completedTasks.indexOf(taskId);
        if (index !== -1) {
          this.completedTasks.splice(index, 1);
          localStorage.setItem("completedTasks", JSON.stringify(this.completedTasks));

          await this.deleteTaskFromFirebase(taskId);
        }
      }
    },

    showRewardsModal() {
      const query = gql`
{
              task(lang: ru, id: "${this.task.id}") {
                id
                name
                finishRewards {
                  traderStanding {
                    trader {
                      name
                      imageLink
                    }
                    standing
                  }
                  items {
                    item {
                      id
                      name
                      iconLink
                    }
                    count
                  }
                }
              }
            }
`;

      request("https://api.tarkov.dev/graphql", query).then((data) => {
        this.rewards = data.task
        console.log(this.rewards)
        this.showModal = true;
      });
    },
    async deleteTaskFromFirebase(taskId) {
      const username = localStorage.getItem("authUser");
      if (!username) {
        console.error("No authenticated user found");
        return;
      }
      const userRef = doc(db, "users", decode(username));

      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let objectives = userData.objectives || [];
        objectives = objectives.map(obj => {
          if (obj.taskId === taskId) {
            return { ...obj, completed: false };
          }
          return obj;
        });

        let counters = userData.counters || [];
        counters = counters.filter(counter => counter.taskId !== taskId);

        let completedTasks = userData.completedTasks || [];
        completedTasks = completedTasks.filter(id => id !== taskId);

        await setDoc(userRef, {
          objectives: objectives,
          counters: counters,
          completedTasks: completedTasks
        }, { merge: true });
      }
    },
    closeModal() {
      this.showModal = false;
    },
  },
};
</script>

<style scoped>
.quest-card {
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.quest-image {
  width: 100%;
  height: 60%;
  background-size: cover;
}

.quest-image img {
  width: 100%;
  height: 100%;
}

.quest-name {
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
  margin-top: 30px;
}

.quest-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.quest-button {
  padding: 5px 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.quest-button.completed {
  background-color: #861d1d;
}

.kappa-icon {
  width: 40px;
  height: 40px;
  background-image: url("../assets/kappa.png");
  background-size: cover;
  margin-left: 10px;
}

.modal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>

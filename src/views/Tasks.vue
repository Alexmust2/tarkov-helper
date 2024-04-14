<template>
    <div class="trader-buttons">
      <TraderButton
        v-for="trader in tradersWithTasks"
        :key="trader.name"
        :trader="trader"
        :tasks="tasks"
        @filter="filterTasks"
      />
      <button
        @click="filterTasks(none)"
        class="trader-button"
        style="background: black"
      >
        <h5>Все торговцы</h5>
      </button>
    </div>
    <input
      style="margin-left: 33vw"
      type="text"
      v-model="searchTerm"
      placeholder="Поиск..."
    />
    <div class="task-interaction">
      <select
        v-on:change="funcSortBy($event.target.value)"
        class="custom-select"
      >
        <option v-for="option in selectOptions" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button @click="deleteProgress()">Сбросить прогресс</button>
      <h3>
        Выполнено {{ funcCompletedTasks.length }}/{{ filteredTasks.length }}
      </h3>
    </div>
    <ul>
      <TaskItem
        v-for="task in filteredSortedTasks"
        :key="task.id"
        :task="task"
        :isTaskCompleted="isTaskCompleted"
        :markTaskCompleted="markTaskCompleted"
        :completedTasks="completedTasks"
      />
    </ul>
</template>

<script>
import TraderButton from '../components/TraderButton.vue';
import TaskItem from '../components/TaskItem.vue';
import { request, gql } from 'graphql-request';

export default {
  components: {
    TraderButton,
    TaskItem,
  },
  data() {
    return {
      tasks: [],
      traders: [],
      selectedTrader: null,
      completedTasks: [],
      sortBy: 'none',
      selectOptions: [
        { label: 'По умолчанию', value: 'none' },
        { label: 'Не выполненные', value: 'incomplete' },
        { label: 'Выполненные', value: 'completed' },
        { label: 'Не нужно для каппы', value: 'notKappa' },
        { label: 'Нужно для каппы', value: 'kappa' },
      ],
      searchTerm: '',
    };
  },
  async mounted() {
    const query = gql`
    {
  tasks(lang: ru) {
    id
    name
    minPlayerLevel
    kappaRequired
    trader{
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
      ... on TaskObjectiveItem {
        type
        description
        item{
          iconLink
        }
        count
      }
    }
  }
      traders (lang: ru){
      id
      name
      imageLink
    }
}

`;

    request('https://api.tarkov.dev/graphql', query).then((data) => {
      console.log(data.tasks);
      this.tasks = data.tasks
      this.traders = data.traders;
      console.log(this.traders);
      // Update completedTasks from localStorage
      this.completedTasks =
        JSON.parse(localStorage.getItem('completedTasks')) || [];
    });
  },
  computed: {
    filteredTasks() {
      if (!this.selectedTrader) return this.tasks;
      return this.tasks.filter(
        (task) => task.trader.id === this.selectedTrader
      );
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
        case 'kappa':
          sorted.sort((a, b) => b.kappaRequired - a.kappaRequired);
          break;
        case 'notKappa':
          sorted.sort((a, b) => a.kappaRequired - b.kappaRequired);
          break;
        case 'experience':
          sorted.sort((a, b) => a.experience - b.experience);
          break;
        case 'completed':
          sorted = sorted.filter((task) => this.isTaskCompleted(task.id));
          break;
        case 'incomplete':
          sorted = sorted.filter((task) => !this.isTaskCompleted(task.id));
          break;
        default:
          break;
      }
      if (this.selectedTrader) {
        sorted = sorted.filter(
          (task) => task.trader.id === this.selectedTrader
        );
      }
      return sorted;
    },
  },
  methods: {
    deleteProgress() {
      localStorage.removeItem('completedTasks');
      window.location.reload();
    },
    markTaskCompleted(taskId) {
      if (!this.completedTasks.includes(taskId)) {
        this.completedTasks.push(taskId);
        localStorage.setItem(
          'completedTasks',
          JSON.stringify(this.completedTasks)
        );
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
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Стили для .trader-buttons */
.trader-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 15px 0;
}

/* Стили для кастомного селекта */
.custom-select {
  appearance: none;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  outline: none;
}

/* Стили для опций селекта */
.custom-select option {
  padding: 5px;
  cursor: pointer;
}

/* При наведении */
.custom-select:hover {
  border-color: #999;
}

/* При активации */
.custom-select:focus {
  border-color: #333;
}

.task-interaction {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  margin: 15px 0;
}

/* Адаптивные стили */
@media screen and (max-width: 768px) {
  /* Стили для .task */
  .task {
    flex-direction: row;
  }

  /* Стили для .task button */
  .task button {
    margin-top: 10px;
  }
}
</style>

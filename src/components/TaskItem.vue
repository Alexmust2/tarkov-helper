<template>
    <li
      :style="{
        backgroundColor: isTaskCompleted(task.id) ? 'lightgreen' : 'white',
      }"
    >
        <div class="task">
            <div class="task-name">{{ task.name }}</div>
            <div class="task-content">
            <div class="task-trader">{{ task.trader }}</div>
            <div class="task-kappa">{{task.kappaRequired ? 'Нужно для каппы' : 'Не нужно для каппы'}}</div>
            <button @click="toggleTaskCompletion" v-if="!isTaskCompleted(task.id)" class="complete-button">
                Выполнитsь
            </button>
            <button @click="toggleTaskCompletion" v-else class="cancel-button">
                Отменить
            </button>
        </div>
      </div>
    </li>
  </template>
  
  <script>
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
    methods: {
      toggleTaskCompletion() {
        if (!this.isTaskCompleted(this.task.id)) {
          this.markTaskCompleted(this.task.id);
        } else {
          // Отменяем выполнение задачи
          const taskId = this.task.id;
          const index = this.completedTasks.indexOf(taskId);
          if (index !== -1) {
            this.completedTasks.splice(index, 1);
            localStorage.setItem('completedTasks', JSON.stringify(this.completedTasks));
          }
          // Дополнительная логика, если задача уже выполнена и нужно что-то сделать
        }
      }
      
    },
  };
  </script>
  
  <style scoped>
  .task {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  
  .task-content {
    display: flex;
    justify-content: space-between;
    align-items: center
  }
  
  .task-name {
    font-weight: bold;
    display: flex;
    align-items: center
  }
  
  .task-trader, .task-kappa {
    margin-right: 15px;
    color: #666;
  }
  
  .complete-button {
    margin-left: 10px;
    padding: 5px 10px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    align-self: flex-end
  }
  
  .cancel-button {
    margin-left: 10px;
    padding: 5px 10px;
    background-color: #861d1d;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    align-self: flex-end
  }
  
  li {
    list-style: none;
  }
  </style>
  
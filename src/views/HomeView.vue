<template>
  <div class="home">
    <h1 style="margin-bottom: 25px">Авторизация</h1>
    <div class="login-form">
      <input type="text" v-model="username" placeholder="Логин" />
      <input type="password" v-model="password" placeholder="Пароль" />
      <button @click="login">Войти</button>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sha256 } from "js-sha256";

export default {
  name: "Home",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  mounted() {
    // Проверяем, есть ли пользователь в localStorage
    this.checkAuthStatus();
  },
  methods: {
    async login() {
      try {
        const userRef = doc(db, "users", this.username);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const user = userSnapshot.data();
          const hashedPassword = sha256(this.password);
          if (user.hashedPassword === hashedPassword) {
            this.saveAuthStatus(this.username);
            console.log("Успешная авторизация!");
          } else {
            console.log("Неправильный пароль");
          }
        } else {
          this.register();
          console.log("Пользователь не найден");
        }
      } catch (error) {
        console.error("Ошибка авторизации:", error);
      }
    },
    async register() {
      try {
        const userRef = doc(db, "users", this.username);
        const hashedPassword = sha256(this.password);
        await setDoc(userRef, { username: this.username, hashedPassword });
        this.saveAuthStatus(this.username);
        console.log("Пользователь зарегистрирован");
      } catch (error) {
        console.error("Ошибка регистрации:", error);
      }
    },
    saveAuthStatus(username) {
      const hashedUsername = sha256(username);
      localStorage.setItem("isAuth", "true");
      localStorage.setItem("authUser", hashedUsername);
    },
    checkAuthStatus() {
      const isAuth = localStorage.getItem("isAuth");
      const authUser = localStorage.getItem("authUser");
      if (isAuth === "true" && authUser) {
        // Пользователь авторизован, можно сделать дополнительные действия
        console.log("Пользователь авторизован");
      }
    },
  },
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f4f4f8;
}

.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgb(71, 69, 69);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

input {
  width: 300px;
  height: 50px;
  padding: 10px;
  margin-bottom: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #0056b3;
}

button {
  width: 300px;
  height: 50px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #004080;
}
</style>

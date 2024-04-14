<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <h2>Страница не найдена</h2>
      <p>
        Кажется, вы зашли слишком далеко в Тарков. Спрячьтесь получше и поищите другой
        путь.
      </p>
      <div class="error-actions">
        <router-link to="/" class="btn btn-primary stylish-button"
          >Вернуться на главную</router-link
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ErrorPage",
};
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #222;
  color: #fff;

  .error-content {
    text-align: center;
    max-width: 600px;
    padding: 40px;

    h1 {
      font-size: 100px;
      font-weight: 900;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    p {
      font-size: 18px;
      margin-bottom: 40px;
    }

    .error-actions {
      .btn {
        margin: 0 10px;
      }
    }
  }

  .error-image {
    flex-basis: 50%;

    img {
      max-width: 100%;
      height: auto;
    }
  }
}
.stylish-button {
  background-color: #007bff; /* Primary blue */
  border: none;
  border-radius: 5px; /* Rounded corners */
  color: white;
  padding: 10px 20px; /* Padding for larger touch area */
  transition: background-color 0.3s ease; /* Smooth transition for hover effect */
}

.stylish-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
  color: #fff;
  text-decoration: none; /* No underline on hover */
}

.stylish-button:focus {
  outline: none; /* Removes the outline on focus for cleaner look */
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5); /* Subtle glow effect */
}
</style>

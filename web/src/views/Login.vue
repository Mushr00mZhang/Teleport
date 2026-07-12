<template>
  <section class="teleport-login">
    <header class="teleport-login-header"></header>
    <main class="teleport-login-main">
      <form class="teleport-login-form" @submit.prevent="login">
        <md-outlined-text-field
          label="登录名"
          v-model="client.loginName"
          :error="loginNameCheck.error"
          :error-text="loginNameCheck.text"
        />
        <md-outlined-text-field label="昵称" v-model="client.nickName" />
        <md-filled-button type="submit">登录</md-filled-button>
      </form>
    </main>
    <footer class="teleport-login-footer"></footer>
  </section>
</template>
<script setup lang="ts">
import '@material/web/textfield/outlined-text-field';
import '@material/web/button/filled-button';
import { computed, reactive } from 'vue';
import { useChatStore } from '@/store/chat';
import { useRouter } from 'vue-router';
const router = useRouter();
const chatStore = useChatStore();
const client = reactive({
  url: 'api/login',
  loginName: localStorage.getItem('loginName') || '',
  nickName: localStorage.getItem('nickName') || '',
  inputting: true,
});

const loginNameCheck = computed(() => {
  if (!client.inputting && !client.loginName)
    return {
      error: true,
      text: '输入不得为空',
    };
  if (client.loginName) {
    if (!/^[A-Za-z0-9]+$/.test(client.loginName))
      return {
        error: true,
        text: '请输入英文或数字',
      };
    if (client.loginName.length > 20)
      return {
        error: true,
        text: '最大长度不得超过20',
      };
  }
  return {
    error: false,
    text: '',
  };
});
const login = async () => {
  client.inputting = false;
  if (!loginNameCheck.value.error) {
    chatStore.login(client.loginName, client.nickName);
    router.push({
      name: 'main',
    });
  }
};
</script>
<style lang="scss">
$prefix-class: 'teleport-login';
.#{$prefix-class} {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  &-header {
    flex: none;
  }
  &-main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  &-footer {
    flex: none;
  }
  &-form {
    width: min(400px, 80%);
    // height: min(300px, 50%);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    margin: auto;
    box-shadow: 0 0 2rem #0003;
    border-radius: 1rem;
  }
}
</style>

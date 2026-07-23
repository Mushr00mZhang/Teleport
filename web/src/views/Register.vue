<template>
  <section class="teleport-register">
    <header class="teleport-register-header"></header>
    <main class="teleport-register-main">
      <form class="teleport-register-form" @submit.prevent="register">
        <md-outlined-text-field
          label="登录名"
          v-model="form.username"
          :error="usernameCheck.error"
          :error-text="usernameCheck.text"
        />
        <md-outlined-text-field
          label="密码"
          type="password"
          v-model="form.password"
          :error="passwordCheck.error"
          :error-text="passwordCheck.text"
        />
        <md-outlined-text-field
          label="确认密码"
          type="password"
          v-model="form.confirmPassword"
          :error="confirmPasswordCheck.error"
          :error-text="confirmPasswordCheck.text"
        />
        <md-outlined-text-field label="昵称" v-model="form.nickname" />
        <md-filled-button type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </md-filled-button>
        <md-outlined-button type="button" @click="router.push({ name: 'login' })">
          返回登录
        </md-outlined-button>
      </form>
    </main>
    <footer class="teleport-register-footer"></footer>
  </section>
</template>

<script setup lang="ts">
import '@material/web/textfield/outlined-text-field';
import '@material/web/button/filled-button';
import '@material/web/button/outlined-button';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import CryptoJS from 'crypto-js';

const router = useRouter();
const toast = useToast();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  inputting: true,
});

const usernameCheck = computed(() => {
  if (!form.inputting && !form.username) return { error: true, text: '用户名不得为空' };
  if (form.username) {
    if (!/^[A-Za-z0-9]+$/.test(form.username)) return { error: true, text: '请输入英文或数字' };
    if (form.username.length > 20) return { error: true, text: '最大长度不得超过20' };
  }
  return { error: false, text: '' };
});

const passwordCheck = computed(() => {
  if (!form.inputting && !form.password) return { error: true, text: '密码不得为空' };
  if (form.password && form.password.length < 6)
    return { error: true, text: '密码长度不得少于6位' };
  return { error: false, text: '' };
});

const confirmPasswordCheck = computed(() => {
  if (!form.inputting && form.password !== form.confirmPassword)
    return { error: true, text: '两次密码输入不一致' };
  return { error: false, text: '' };
});

const register = async () => {
  form.inputting = false;

  if (usernameCheck.value.error || passwordCheck.value.error || confirmPasswordCheck.value.error) {
    return;
  }

  loading.value = true;
  try {
    const hashedPassword = CryptoJS.MD5(form.password).toString();
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        nickname: form.nickname || form.username,
        password: hashedPassword,
      }),
    });
    const data = await resp.json();
    if (resp.ok && data.success) {
      toast.success('注册成功，即将跳转登录...');
      setTimeout(() => {
        router.push({ name: 'login' });
      }, 1500);
    } else {
      toast.error(data.error || '注册失败');
    }
  } catch (e) {
    toast.error('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss">
$prefix-class: 'teleport-register';
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

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-2xl space-y-6">
      
      <!-- 标题 -->
      <h1 class="text-4xl font-bold text-center text-gray-900 mb-8">
        {{ title }}
      </h1>
      
      <!-- 配置加载 -->
      <div class="card p-6 space-y-4">
        <div class="flex gap-3">
          <input
            v-model="configUrl"
            type="text"
            placeholder="配置文件 URL"
            class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            @keyup.enter="handleLoadFromUrl"
          />
          <button
            @click="handleLoadFromUrl"
            :disabled="loading"
            class="btn-primary px-6 py-2.5 disabled:opacity-50"
          >
            {{ loading ? '加载中...' : '加载' }}
          </button>
        </div>
        
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
        <p v-if="successMessage" class="text-green-600 text-sm">{{ successMessage }}</p>
      </div>
      
      <!-- 学生列表 -->
      <div v-if="students.length > 0" class="card p-6 space-y-4">
        <div class="text-center text-gray-500 text-sm">
          共 {{ students.length }} 名学生
        </div>
        
        <div class="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
          <div
            v-for="student in students"
            :key="student.id"
            class="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {{ student.name }}
          </div>
        </div>
      </div>
      
      <!-- 抽选按钮 -->
      <div class="flex justify-center">
        <button
          @click="performPick"
          :disabled="isPicking || students.length === 0"
          class="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {{ isPicking ? '抽选中...' : '开始抽选' }}
        </button>
      </div>
      
      <!-- 抽选结果 -->
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="currentPick" class="card p-8 space-y-4 border-2 border-blue-500">
          <div class="text-center">
            <div class="text-gray-500 text-sm mb-2">抽选结果</div>
            <div class="text-5xl font-bold text-gray-900">{{ currentPick.name }}</div>
          </div>
          
          <div class="flex justify-center">
            <button
              @click="resetCurrentPick"
              class="btn-secondary px-6 py-2"
            >
              重新抽选
            </button>
          </div>
        </div>
      </Transition>
      
      <!-- 历史记录 -->
      <div v-if="pickHistory.length > 0" class="card p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">历史记录</h3>
          <button
            @click="clearHistory"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            清空
          </button>
        </div>
        
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="(record, index) in pickHistory.slice(0, 10)"
            :key="index"
            class="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            <span class="text-gray-900 font-medium">{{ record.student.name }}</span>
            <span class="text-gray-500">{{ formatTime(record.timestamp) }}</span>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStudents } from './composables/useStudents';

const {
  students,
  title,
  pickHistory,
  currentPick,
  isPicking,
  error,
  loadFromUrl,
  performPick,
  clearHistory,
  resetCurrentPick,
} = useStudents();

const configUrl = ref('');
const loading = ref(false);
const successMessage = ref('');

watch(() => error.value, () => {
  if (error.value) {
    successMessage.value = '';
  }
});

async function handleLoadFromUrl() {
  if (!configUrl.value.trim()) return;
  
  loading.value = true;
  successMessage.value = '';
  
  const success = await loadFromUrl(configUrl.value.trim());
  
  loading.value = false;
  
  if (success) {
    successMessage.value = '配置加载成功';
    configUrl.value = '';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

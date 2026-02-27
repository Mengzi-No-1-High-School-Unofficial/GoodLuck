<template>
  <div class="min-h-screen flex items-center justify-center p-3 sm:p-6">
    <div class="w-full max-w-2xl space-y-4 sm:space-y-6">

      <!-- 标题 -->
      <h1 class="text-2xl sm:text-4xl font-bold text-center text-gray-900 mb-4 sm:mb-8">
        {{ title }}
      </h1>

      <!-- 配置加载 -->
      <div class="card p-4 sm:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <input v-model="configUrl" type="text" placeholder="配置文件 URL"
            class="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base"
            @keyup.enter="handleLoadFromUrl" />
          <input v-model="password" type="password" placeholder="密码（可选）"
            class="w-full sm:w-32 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base"
            @keyup.enter="handleLoadFromUrl" />
          <button @click="handleLoadFromUrl" :disabled="loading"
            class="btn-primary px-6 py-2.5 disabled:opacity-50 whitespace-nowrap text-sm sm:text-base">
            {{ loading ? '加载中...' : '加载' }}
          </button>
        </div>

        <p v-if="error" class="text-red-600 text-sm font-medium break-words">{{ error }}</p>
        <p v-if="successMessage" class="text-green-600 text-sm font-medium">{{ successMessage }}</p>
        <p v-if="isDecrypting" class="text-blue-600 text-sm font-medium">🔓 正在解密配置...</p>
      </div>

      <!-- 抽选设置 -->
      <div v-if="students.length > 0" class="space-y-4">
        <div v-if="allGroups.length > 0" class="card px-4 sm:px-6 py-4">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-gray-500 text-sm font-medium">抽选分组:</span>
            <div class="flex flex-wrap gap-2">
              <button @click="currentGroupName = null" :class="[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                currentGroupName === null
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]">
                全部
              </button>
              <button v-for="group in allGroups" :key="group" @click="currentGroupName = group" :class="[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                currentGroupName === group
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]">
                {{ group }}
              </button>
            </div>
          </div>
        </div>

        <div
          class="card px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full">
            <label class="flex items-center cursor-pointer select-none">
              <div class="relative">
                <input type="checkbox" v-model="excludePicked" class="sr-only" />
                <div class="block bg-gray-200 w-10 h-6 rounded-full transition-colors"
                  :class="{ 'bg-blue-600': excludePicked }"></div>
                <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"
                  :class="{ 'translate-x-4': excludePicked }"></div>
              </div>
              <span class="ml-3 text-gray-700 font-medium text-sm">不重复抽选</span>
            </label>

            <label class="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <span>抽取人数</span>
              <input
                v-model.number="pickCount"
                type="number"
                min="1"
                :max="Math.max(availableStudents.length, 1)"
                class="w-20 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </label>
          </div>
          <div class="text-gray-500 text-xs sm:ml-auto">
            可用人员: {{ availableStudents.length }} / {{currentGroupName ? students.filter(s => s.group ===
              currentGroupName).length : students.length}}
          </div>
        </div>
        <p v-if="pickNotice" class="text-amber-600 text-sm font-medium px-1">{{ pickNotice }}</p>
      </div>

      <!-- 学生列表 -->
      <div v-if="students.length > 0" class="card p-4 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div class="text-gray-500 text-sm">
            人员列表 ({{currentGroupName ? students.filter(s => s.group === currentGroupName).length : students.length}})
          </div>
          <button v-if="students.length > 10" @click="isExpanded = !isExpanded"
            class="text-blue-600 text-xs font-medium hover:text-blue-700">
            {{ isExpanded ? '收起' : '查看全部' }}
          </button>
        </div>

        <div class="flex flex-wrap gap-2 justify-center transition-all duration-300">
          <div v-for="student in displayedStudents" :key="student.id" :class="[
            'px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all',
            isStudentPicked(student.id) && excludePicked
              ? 'bg-gray-200 border border-gray-300 text-gray-400 line-through opacity-60'
              : 'bg-gray-50 border border-gray-100 text-gray-700'
          ]">
            {{ student.name }}
          </div>
          <div v-if="!isExpanded && students.length > 10"
            class="flex items-center px-2 py-1 text-gray-400 text-xs italic">
            ... 及其它 {{ students.length - 10 }} 位
          </div>
        </div>
      </div>

      <!-- 抽选按钮 -->
      <div class="flex justify-center pt-2">
        <button @click="performPick" :disabled="isPicking || students.length === 0"
          class="btn-primary w-full max-w-xs py-3 sm:py-4 text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] transition-transform">
          {{ isPicking ? '抽选中...' : `开始抽选 (${pickCount}人)` }}
        </button>
      </div>

      <!-- 抽选结果 -->
      <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
        <div v-if="currentPicks.length > 0" class="card p-6 sm:p-8 space-y-4 border-2 border-blue-500 ring-4 ring-blue-50">
          <div class="text-center">
            <div class="text-gray-500 text-sm mb-2 font-medium tracking-wide">抽选结果</div>
            <div class="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">
              <span
                v-for="student in currentPicks"
                :key="student.id"
                class="px-3 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-lg sm:text-2xl font-bold"
              >
                {{ student.name }}
              </span>
            </div>
            <div class="text-base sm:text-lg text-gray-500 mt-2 sm:mt-3">共 {{ currentPicks.length }} 人</div>
          </div>

          <div class="flex justify-center pt-2">
            <button @click="resetCurrentPick"
              class="btn-secondary px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider">
              确定
            </button>
          </div>
        </div>
      </Transition>

      <!-- 历史记录 -->
      <div v-if="pickHistory.length > 0" class="card p-4 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-gray-900 text-base sm:text-lg">最近记录</h3>
          <button @click="clearHistory"
            class="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors uppercase tracking-widest">
            重置
          </button>
        </div>

        <div class="space-y-2">
          <div v-for="(record, index) in pickHistory.slice(0, 5)" :key="index"
            class="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg text-sm group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-gray-900 font-semibold truncate">{{ record.students.map(s => s.name).join('、') }}</span>
              <span class="text-gray-500 text-xs mt-0.5">共 {{ record.students.length }} 人</span>
            </div>
            <span class="text-gray-400 text-xs tabular-nums ml-2 flex-shrink-0">{{ formatTime(record.timestamp)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 开发者信息 -->
      <div class="text-center text-gray-400 mt-8 pb-4 text-sm">
        <p>开发者：Xyber Nova &lt;xyber-nova@outlook.com</p>
        <p class="mt-1">本程序以 <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank"
            class="hover:text-gray-600 underline">MPL-2.0</a> 开源于 
            <a href="https://github.com/Mengzi-No-1-High-School-Unofficial/GoodLuck" target="_blank" class="hover:text-gray-600 underline">GitHub</a>
          </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStudents } from './composables/useStudents';

const {
  students,
  title,
  pickHistory,
  currentPicks,
  pickCount,
  pickNotice,
  isPicking,
  error,
  excludePicked,
  currentGroupName,
  allGroups,
  availableStudents,
  loadFromUrl,
  performPick,
  clearHistory,
  resetCurrentPick,
} = useStudents();

const configUrl = ref('');
const password = ref('');
const loading = ref(false);
const successMessage = ref('');
const isExpanded = ref(false);
const isDecrypting = ref(false);

const displayedStudents = computed(() => {
  const list = currentGroupName.value
    ? students.value.filter(s => s.group === currentGroupName.value)
    : students.value;

  if (isExpanded.value || list.length <= 10) {
    return list;
  }
  return list.slice(0, 10);
});

watch(() => error.value, () => {
  if (error.value) {
    successMessage.value = '';
    isDecrypting.value = false;
  }
});


async function handleLoadFromUrl() {
  if (!configUrl.value.trim()) return;

  loading.value = true;
  successMessage.value = '';
  isDecrypting.value = false;

  // 如果有密码，显示解密状态
  if (password.value) {
    isDecrypting.value = true;
  }

  const success = await loadFromUrl(configUrl.value.trim(), password.value || undefined);

  loading.value = false;
  isDecrypting.value = false;

  if (success) {
    successMessage.value = password.value ? '配置解密并加载成功' : '配置加载成功';
    configUrl.value = '';
    password.value = '';
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
    second: '2-digit',
  });
}

function isStudentPicked(studentId: string): boolean {
  return pickHistory.value.some(record => record.students.some(student => student.id === studentId));
}
</script>

<style scoped>
.dot {
  transition: transform 0.2s ease-in-out;
}
</style>

import { computed, ref } from 'vue';
import type { Config, PickHistory, Student } from '../types';
import {
    generateId,
    loadConfigFromLocal,
    loadConfigFromUrl,
    saveConfigToLocal,
    weightedRandomPick
} from '../utils';

export function useStudents() {
    // 学生列表
    const students = ref<Student[]>([]);

    // 配置标题
    const title = ref<string>('学生抽选系统');

    // 抽选历史
    const pickHistory = ref<PickHistory[]>([]);

    // 当前抽中的学生
    const currentPick = ref<Student | null>(null);

    // 是否正在抽选
    const isPicking = ref(false);

    // 错误信息
    const error = ref<string>('');

    // 计算总权重
    const totalWeight = computed(() =>
        students.value.reduce((sum, s) => sum + s.weight, 0)
    );

    // 添加学生
    function addStudent(name: string, weight: number = 1) {
        const student: Student = {
            id: generateId(),
            name,
            weight: Math.max(0.1, weight), // 确保权重至少为 0.1
        };
        students.value.push(student);
        saveConfig();
    }

    // 更新学生
    function updateStudent(id: string, updates: Partial<Student>) {
        const index = students.value.findIndex(s => s.id === id);
        if (index !== -1) {
            students.value[index] = { ...students.value[index], ...updates };
            saveConfig();
        }
    }

    // 删除学生
    function removeStudent(id: string) {
        students.value = students.value.filter(s => s.id !== id);
        saveConfig();
    }

    // 保存配置
    function saveConfig() {
        const config: Config = {
            students: students.value,
            title: title.value,
        };
        saveConfigToLocal(config);
    }

    // 从本地加载配置
    function loadLocalConfig() {
        const config = loadConfigFromLocal();
        if (config) {
            students.value = config.students;
            if (config.title) {
                title.value = config.title;
            }
        }
    }

    // 从 URL 加载配置
    async function loadFromUrl(url: string) {
        try {
            error.value = '';
            const config = await loadConfigFromUrl(url);
            students.value = config.students;
            if (config.title) {
                title.value = config.title;
            }
            saveConfig();
            return true;
        } catch (e) {
            error.value = e instanceof Error ? e.message : '加载失败';
            return false;
        }
    }

    // 执行抽选
    async function performPick() {
        if (students.value.length === 0) {
            error.value = '没有可抽选的学生';
            return;
        }

        isPicking.value = true;
        error.value = '';
        currentPick.value = null;

        // 模拟抽选动画（2秒）
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 执行加权随机抽选
        const picked = weightedRandomPick(students.value);

        if (picked) {
            currentPick.value = picked;
            pickHistory.value.unshift({
                student: picked,
                timestamp: Date.now(),
            });

            // 限制历史记录数量
            if (pickHistory.value.length > 20) {
                pickHistory.value = pickHistory.value.slice(0, 20);
            }
        }

        isPicking.value = false;
    }

    // 清空历史
    function clearHistory() {
        pickHistory.value = [];
    }

    // 重置当前抽选
    function resetCurrentPick() {
        currentPick.value = null;
    }

    // 初始化时加载本地配置
    loadLocalConfig();

    return {
        students,
        title,
        pickHistory,
        currentPick,
        isPicking,
        error,
        totalWeight,
        addStudent,
        updateStudent,
        removeStudent,
        loadFromUrl,
        performPick,
        clearHistory,
        resetCurrentPick,
    };
}

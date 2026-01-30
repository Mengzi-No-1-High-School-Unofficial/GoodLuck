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

    // 排除已抽选学生
    const excludePicked = ref(true);

    // 当前选择的分组名
    const currentGroupName = ref<string | null>(null);

    // 计算可用学生列表
    const availableStudents = computed(() => {
        let list = students.value;
        if (currentGroupName.value) {
            list = list.filter(s => s.group === currentGroupName.value);
        }
        if (!excludePicked.value) return list;
        const pickedIds = new Set(pickHistory.value.map(h => h.student.id));
        return list.filter(s => !pickedIds.has(s.id));
    });

    // 所有可用分组
    const allGroups = computed(() => {
        const groups = new Set<string>();
        students.value.forEach(s => {
            if (s.group) groups.add(s.group);
        });
        return Array.from(groups).sort();
    });

    // 计算总权重 (基于可用学生)
    const totalWeight = computed(() =>
        availableStudents.value.reduce((sum: number, s: Student) => sum + s.weight, 0)
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
            students.value[index] = { ...students.value[index], ...updates } as Student;
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
            applyConfig(config);
        }
    }

    // 应用配置到状态
    function applyConfig(config: Config) {
        let allStudents: Student[] = [];

        // 处理扁平列表
        if (config.students) {
            allStudents = [...config.students];
        }

        // 处理分组列表
        if (config.groups) {
            config.groups.forEach(group => {
                group.students.forEach(student => {
                    allStudents.push({
                        ...student,
                        group: group.name
                    });
                });
            });
        }

        students.value = allStudents;
        if (config.title) {
            title.value = config.title;
        }

        // 如果原分组不存在了，重置分组选择
        if (currentGroupName.value && !allGroups.value.includes(currentGroupName.value)) {
            currentGroupName.value = null;
        }
    }

    async function loadFromUrl(url: string, password?: string) {
        try {
            error.value = '';
            const config = await loadConfigFromUrl(url, password);
            applyConfig(config);
            saveConfig();
            return true;
        } catch (e) {
            error.value = e instanceof Error ? e.message : '加载失败';
            return false;
        }
    }

    // 执行抽选
    async function performPick() {
        if (availableStudents.value.length === 0) {
            error.value = excludePicked.value ? '所有学生都已抽选过，请重置历史记录' : '没有可抽选的学生';
            return;
        }

        isPicking.value = true;
        error.value = '';
        currentPick.value = null;

        // 模拟抽选动画（1秒）
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 执行加权随机抽选
        const picked = weightedRandomPick(availableStudents.value);

        if (picked) {
            currentPick.value = picked;
            pickHistory.value.unshift({
                student: picked,
                timestamp: Date.now(),
            });

            // 限制历史记录数量
            if (!excludePicked.value && pickHistory.value.length > 50) {
                pickHistory.value = pickHistory.value.slice(0, 50);
            }
        }

        isPicking.value = false;
    }

    // 清空历史
    function clearHistory() {
        pickHistory.value = [];
        currentPick.value = null;
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
        excludePicked,
        currentGroupName,
        allGroups,
        availableStudents,
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

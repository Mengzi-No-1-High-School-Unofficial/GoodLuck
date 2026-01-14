// 学生数据接口
export interface Student {
    id: string;
    name: string;
    weight: number;
    info?: string; // 附属信息，如班级、组别等
}

// 配置文件接口
export interface Config {
    students: Student[];
    title?: string;
}

// 抽选历史记录
export interface PickHistory {
    student: Student;
    timestamp: number;
}

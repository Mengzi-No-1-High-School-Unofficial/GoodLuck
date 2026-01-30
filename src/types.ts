// 学生数据接口
export interface Student {
    id: string;
    name: string;
    weight: number;
    group?: string; // 抽选组名
    info?: string; // 附属信息，如班级、组别等
}

// 分组接口
export interface Group {
    name: string;
    students: Student[];
}

// 配置文件接口
export interface Config {
    students?: Student[];
    groups?: Group[];
    title?: string;
}

// 抽选历史记录
export interface PickHistory {
    student: Student;
    timestamp: number;
}

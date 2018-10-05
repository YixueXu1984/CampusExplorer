export interface INode {
    level: number;
    filterName: string;
    key: string;
    filterValue: string | number;
    childNodes: INode[];
}

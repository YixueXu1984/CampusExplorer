export interface INode {
    filterName: string;
    key: string;
    filterValue: string | number;
    childNodes: INode[];
}

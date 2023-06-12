export interface CRUD {
  list: (query:any) => Promise<unknown>;
  create: (resource: any) => Promise<any>;
  putById: (id: string, resource: any) => Promise<unknown>;
  readById: (id: string) => Promise<any>;
  deleteById: (id: string) => Promise<void>;
  patchById: (id: string, resource: any) => Promise<unknown>;
}
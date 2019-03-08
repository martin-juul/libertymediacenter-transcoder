
export interface TaskID {
  folderId: string;
  prependFileId: string;
}

export interface NewTask {
  taskId: TaskID;
  playlistPath: string;
}
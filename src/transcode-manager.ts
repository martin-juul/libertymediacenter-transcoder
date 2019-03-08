import { TaskID, NewTask } from './interfaces/task.interface';
import { TranscodeTask, TranscodeTaskEvent, TranscodingOptions } from './transcode-task';
import { TranscodeJob } from './interfaces/transcode-job.interface';
import { eventBus } from './main';
import { $log } from 'ts-log-debug';
import { sha256 } from './utils';

export interface TranscodeInstance {
  taskId: TaskID;
  task: TranscodeTask;
}

export enum TranscodeManagerEvent {
  ADDED_TASK = 'transcode_manager#added_task',
  STOPPED_TASK = 'transcode_manager#stopped_task',
}

export class TranscodeManager {
  private _tasks: TranscodeInstance[] = [];

  constructor() {
    eventBus.on(TranscodeTaskEvent.STOPPED, (id: TaskID) => {
      this.remove(id)
        .then()
        .catch($log.error);
    });
  }

  public add(job: TranscodeJob): Promise<NewTask> {
    return new Promise(((resolve, reject) => {
      if (this._tasks.length >= Number(process.env.MAX_TRANSCODES)) {
        reject(new Error(`Instance reached MAX_TRANSCODES (${process.env.MAX_TRANSCODES}) limit!`))
      }

      const taskId = this.generateTaskId(job);

      if (this._tasks.filter(x => x.taskId === taskId).length > 0) {
        reject(new Error('Transcode job is already running.'));
      } else {
        const task = new TranscodeTask(taskId, job.filePath, job.outputDirectory, job.options);
        const instance: TranscodeInstance = {
          taskId,
          task,
        };

        this._tasks.push(instance);
        eventBus.emit(TranscodeManagerEvent.ADDED_TASK, { taskId });

        task.start()
          .then((playlistPath) => resolve({taskId, playlistPath}))
          .catch(reject);
      }
    }));
  }

  public async remove(taskId: TaskID) {
    const idx = this._tasks.findIndex(x => x.taskId === taskId)[0];

    if (idx) {
      await this._tasks[idx].task.stop();
      this._tasks.splice(idx, 1);

      eventBus.emit(TranscodeManagerEvent.STOPPED_TASK, { taskId: taskId });

      $log.info(`[TranscodeManager]: Removed task ${taskId} | Running ${this._tasks.length}`);
    }
  }

  private generateTaskId(job: TranscodeJob): TaskID {
    const audio = job.options.audio;
    const video = job.options.video;

    return {
      folderId: sha256(job.filePath),
      prependFileId: sha256(`${JSON.stringify({
        audio,
        video,
      })}`)
    };
  }
}



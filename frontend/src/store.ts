import {create} from "zustand";
import {persist} from "zustand/middleware";

export type Project = {
  id: string;
  name: string;
  description: string;
  unityVersion: string;
  frameSize: number;
  fps: number;
  updatedAt: string;
};

export type Character = {
  id: string;
  projectId: string;
  name: string;
  tags: string[];
  actions: number;
};

export type CharacterAction = {
  id: string;
  characterId: string;
  name: string;
  direction: string;
  fps: number;
  loop: boolean;
};


export type GenerationTaskStatus = "queued" | "running" | "completed" | "failed";

export type CharacterGeneration = {
  id: string;
  projectId: string;
  characterName: string;
  prompt: string;
  manualPrompt?: string;
  finalPrompt?: string;
  templateId?: string;
  providerId?: "mock" | "spriteforge-server";
  negativePrompt: string;
  style: string;
  resolution: number;
  direction: "front" | "back" | "side";
  seed: number;
  consistency: number;
  referenceAssetId?: string;
  createdAt: string;
  status: GenerationTaskStatus;
  progress: number;
  resultAssetIds: string[];
  selectedResultAssetId?: string;
  error?: string;
};

export type AnimationFrame = {
  id: string;
  actionId: string;
  name: string;
  assetId?: string;
  legacyDataUrl?: string;
  width: number;
  height: number;
  enabled: boolean;
  selected: boolean;
  order: number;
  source: "image" | "video";
  sourceTime?: number;
};

type State = {
  projects: Project[];
  characters: Character[];
  actions: CharacterAction[];
  frames: AnimationFrame[];
  generations: CharacterGeneration[];
  activeCharacterId: string | null;
  activeActionId: string | null;

  createProject: (project: Omit<Project, "id" | "updatedAt">) => string;
  deleteProject: (id: string) => string[];
  createCharacter: (projectId: string, name: string, tags: string[]) => void;
  deleteCharacter: (id: string) => string[];

  selectCharacter: (id: string) => void;
  createAction: (
    characterId: string,
    name: string,
    direction: string,
    fps: number,
    loop: boolean
  ) => string;
  updateAction: (id: string, patch: Partial<CharacterAction>) => void;
  deleteAction: (id: string) => string[];
  selectAction: (id: string) => void;

  addFrames: (
    frames: Omit<AnimationFrame, "id" | "order" | "selected">[]
  ) => void;
  updateFrame: (id: string, patch: Partial<AnimationFrame>) => void;
  deleteFrame: (id: string) => string | undefined;
  deleteSelectedFrames: (actionId: string) => string[];
  setAllFramesEnabled: (actionId: string, enabled: boolean) => void;
  setFrameEnablePattern: (actionId: string, skipCount: number) => void;
  toggleFrameEnabled: (id: string) => void;
  setAllFramesSelected: (actionId: string, selected: boolean) => void;
  toggleFrameSelected: (id: string) => void;
  moveFrame: (id: string, direction: -1 | 1) => void;
  clearActionFrames: (actionId: string) => string[];

  createGenerationTask: (
    task: Omit<
      CharacterGeneration,
      "id" | "createdAt" | "status" | "progress" | "resultAssetIds"
    >
  ) => string;
  updateGenerationTask: (
    id: string,
    patch: Partial<CharacterGeneration>
  ) => void;
  deleteGenerationTask: (id: string) => string[];
  setGenerationResult: (taskId: string, assetId: string) => void;
};

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

const now = () => new Date().toISOString();

const demoProject: Project = {
  id: "demo",
  name: "三国角色项目",
  description: "验证 256×256、12FPS 与 Unity 导出流程。",
  unityVersion: "2022.3 LTS",
  frameSize: 256,
  fps: 12,
  updatedAt: now()
};

const demoCharacters: Character[] = [
  {id: "guanyu", projectId: "demo", name: "关羽", tags: ["三国", "武将"], actions: 2},
  {id: "luxun", projectId: "demo", name: "陆逊", tags: ["三国", "法师"], actions: 4}
];

const demoActions: CharacterAction[] = [
  {
    id: "guanyu_charge",
    characterId: "guanyu",
    name: "蓄力",
    direction: "south",
    fps: 12,
    loop: true
  },
  {
    id: "guanyu_attack",
    characterId: "guanyu",
    name: "攻击",
    direction: "south",
    fps: 12,
    loop: false
  }
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projects: [demoProject],
      characters: demoCharacters,
      actions: demoActions,
      frames: [],
      generations: [],
      activeCharacterId: "guanyu",
      activeActionId: "guanyu_charge",

      createProject: (project) => {
        const item = {...project, id: makeId("project"), updatedAt: now()};
        set((state) => ({projects: [item, ...state.projects]}));
        return item.id;
      },

      deleteProject: (projectId) => {
        const characterIds = get()
          .characters.filter((character) => character.projectId === projectId)
          .map((character) => character.id);
        const actionIds = get()
          .actions.filter((action) => characterIds.includes(action.characterId))
          .map((action) => action.id);
        const assetIds = get()
          .frames.filter((frame) => actionIds.includes(frame.actionId))
          .flatMap((frame) => (frame.assetId ? [frame.assetId] : []));

        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          characters: state.characters.filter(
            (character) => character.projectId !== projectId
          ),
          actions: state.actions.filter(
            (action) => !characterIds.includes(action.characterId)
          ),
          frames: state.frames.filter((frame) => !actionIds.includes(frame.actionId))
        }));

        return assetIds;
      },

      createCharacter: (projectId, name, tags) =>
        set((state) => ({
          characters: [
            {
              id: makeId("character"),
              projectId,
              name,
              tags,
              actions: 0
            },
            ...state.characters
          ]
        })),

      deleteCharacter: (characterId) => {
        const actionIds = get()
          .actions.filter((action) => action.characterId === characterId)
          .map((action) => action.id);
        const assetIds = get()
          .frames.filter((frame) => actionIds.includes(frame.actionId))
          .flatMap((frame) => (frame.assetId ? [frame.assetId] : []));

        set((state) => ({
          characters: state.characters.filter(
            (character) => character.id !== characterId
          ),
          actions: state.actions.filter(
            (action) => action.characterId !== characterId
          ),
          frames: state.frames.filter((frame) => !actionIds.includes(frame.actionId))
        }));

        return assetIds;
      },

      selectCharacter: (characterId) => {
        const firstAction = get().actions.find(
          (action) => action.characterId === characterId
        );
        set({
          activeCharacterId: characterId,
          activeActionId: firstAction?.id ?? null
        });
      },

      createAction: (characterId, name, direction, fps, loop) => {
        const action = {
          id: makeId("action"),
          characterId,
          name,
          direction,
          fps,
          loop
        };
        set((state) => ({
          actions: [...state.actions, action],
          characters: state.characters.map((character) =>
            character.id === characterId
              ? {...character, actions: character.actions + 1}
              : character
          ),
          activeActionId: action.id
        }));
        return action.id;
      },

      updateAction: (id, patch) =>
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id ? {...action, ...patch} : action
          )
        })),

      deleteAction: (id) => {
        const action = get().actions.find((item) => item.id === id);
        const assetIds = get()
          .frames.filter((frame) => frame.actionId === id)
          .flatMap((frame) => (frame.assetId ? [frame.assetId] : []));

        set((state) => ({
          actions: state.actions.filter((item) => item.id !== id),
          frames: state.frames.filter((frame) => frame.actionId !== id),
          characters: state.characters.map((character) =>
            character.id === action?.characterId
              ? {...character, actions: Math.max(0, character.actions - 1)}
              : character
          ),
          activeActionId: state.activeActionId === id ? null : state.activeActionId
        }));

        return assetIds;
      },

      selectAction: (id) => set({activeActionId: id}),

      addFrames: (items) =>
        set((state) => {
          const actionOffsets = new Map<string, number>();
          items.forEach((item) => {
            if (!actionOffsets.has(item.actionId)) {
              actionOffsets.set(
                item.actionId,
                state.frames.filter((frame) => frame.actionId === item.actionId)
                  .length
              );
            }
          });

          const actionCounters = new Map<string, number>();

          return {
            frames: [
              ...state.frames,
              ...items.map((item) => {
                const counter = actionCounters.get(item.actionId) ?? 0;
                actionCounters.set(item.actionId, counter + 1);

                return {
                  ...item,
                  id: makeId("frame"),
                  selected: true,
                  order: (actionOffsets.get(item.actionId) ?? 0) + counter
                };
              })
            ]
          };
        }),

      updateFrame: (id, patch) =>
        set((state) => ({
          frames: state.frames.map((frame) =>
            frame.id === id ? {...frame, ...patch} : frame
          )
        })),

      deleteFrame: (id) => {
        const frame = get().frames.find((item) => item.id === id);
        set((state) => ({
          frames: state.frames.filter((item) => item.id !== id)
        }));
        return frame?.assetId;
      },

      deleteSelectedFrames: (actionId) => {
        const selected = get().frames.filter(
          (frame) => frame.actionId === actionId && frame.selected
        );
        set((state) => ({
          frames: state.frames.filter(
            (frame) => !(frame.actionId === actionId && frame.selected)
          )
        }));
        return selected.flatMap((frame) => (frame.assetId ? [frame.assetId] : []));
      },

      setAllFramesEnabled: (actionId, enabled) =>
        set((state) => ({
          frames: state.frames.map((frame) =>
            frame.actionId === actionId ? {...frame, enabled} : frame
          )
        })),

      setFrameEnablePattern: (actionId, skipCount) =>
        set((state) => {
          const ordered = state.frames
            .filter((frame) => frame.actionId === actionId)
            .sort((a, b) => a.order - b.order);

          const enabledIds = new Set(
            ordered
              .filter((_, index) => index % (skipCount + 1) === 0)
              .map((frame) => frame.id)
          );

          return {
            frames: state.frames.map((frame) =>
              frame.actionId === actionId
                ? {...frame, enabled: enabledIds.has(frame.id)}
                : frame
            )
          };
        }),

      toggleFrameEnabled: (id) =>
        set((state) => ({
          frames: state.frames.map((frame) =>
            frame.id === id ? {...frame, enabled: !frame.enabled} : frame
          )
        })),

      setAllFramesSelected: (actionId, selected) =>
        set((state) => ({
          frames: state.frames.map((frame) =>
            frame.actionId === actionId ? {...frame, selected} : frame
          )
        })),

      toggleFrameSelected: (id) =>
        set((state) => ({
          frames: state.frames.map((frame) =>
            frame.id === id ? {...frame, selected: !frame.selected} : frame
          )
        })),

      moveFrame: (id, direction) =>
        set((state) => {
          const current = state.frames.find((frame) => frame.id === id);
          if (!current) return state;

          const ordered = state.frames
            .filter((frame) => frame.actionId === current.actionId)
            .sort((a, b) => a.order - b.order);
          const currentIndex = ordered.findIndex((frame) => frame.id === id);
          const nextIndex = currentIndex + direction;
          if (nextIndex < 0 || nextIndex >= ordered.length) return state;

          const other = ordered[nextIndex];

          return {
            frames: state.frames.map((frame) => {
              if (frame.id === current.id) return {...frame, order: other.order};
              if (frame.id === other.id) return {...frame, order: current.order};
              return frame;
            })
          };
        }),

      clearActionFrames: (actionId) => {
        const assetIds = get()
          .frames.filter((frame) => frame.actionId === actionId)
          .flatMap((frame) => (frame.assetId ? [frame.assetId] : []));
        set((state) => ({
          frames: state.frames.filter((frame) => frame.actionId !== actionId)
        }));
        return assetIds;
      }
,

      createGenerationTask: (task) => {
        const item: CharacterGeneration = {
          ...task,
          id: makeId("generation"),
          createdAt: now(),
          status: "queued",
          progress: 0,
          resultAssetIds: []
        };
        set((state) => ({generations: [item, ...state.generations]}));
        return item.id;
      },

      updateGenerationTask: (id, patch) =>
        set((state) => ({
          generations: state.generations.map((task) =>
            task.id === id ? {...task, ...patch} : task
          )
        })),

      deleteGenerationTask: (id) => {
        const task = get().generations.find((item) => item.id === id);
        set((state) => ({
          generations: state.generations.filter((item) => item.id !== id)
        }));
        return task?.resultAssetIds ?? [];
      },

      setGenerationResult: (taskId, assetId) =>
        set((state) => ({
          generations: state.generations.map((task) =>
            task.id === taskId
              ? {...task, selectedResultAssetId: assetId}
              : task
          )
        }))
    }),
    {
      name: "spriteforge-workspace-v2",
      version: 3,
      migrate: (persisted: unknown) => {
        const state = persisted as Partial<State> | undefined;
        if (!state) return state as State;

        return {
          ...state,
          generations: state.generations ?? [],
          frames: (state.frames ?? []).map((frame) => {
            const legacy = frame as AnimationFrame & {dataUrl?: string};
            return {
              ...legacy,
              legacyDataUrl: legacy.legacyDataUrl ?? legacy.dataUrl,
              source: legacy.source ?? "image",
              selected: legacy.selected ?? true
            };
          })
        } as State;
      }
    }
  )
);

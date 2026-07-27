import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  deleteAsset,
  deleteAssets,
  getAsset,
  getStorageEstimate,
  saveAssets,
  StoredAsset
} from "./db";
import {AnimationFrame, CharacterGeneration, useStore} from "./store";
import {
  buildCharacterPrompt,
  characterTemplates,
  CharacterTemplateId,
  getCharacterTemplate
} from "./characterTemplates";
import {spriteForgeServerProvider} from "./characterProvider";

const navigation = [
  ["/", "⌂", "首页"],
  ["/projects", "▦", "项目"],
  ["/characters", "♟", "人物"],
  ["/animations", "▶", "动画"],
  ["/sprites", "▦", "序列帧"],
  ["/ai-studio", "✦", "AI Studio"],
  ["/unity", "U", "Unity 导出"]
];

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

function formatBytes(value: number) {
  if (!value) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index >= 2 ? 1 : 0)} ${units[index]}`;
}

function useAssetUrl(frame?: AnimationFrame | null) {
  const [url, setUrl] = useState(frame?.legacyDataUrl ?? "");

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    if (!frame) {
      setUrl("");
      return;
    }

    if (frame.legacyDataUrl) {
      setUrl(frame.legacyDataUrl);
      return;
    }

    if (!frame.assetId) {
      setUrl("");
      return;
    }

    getAsset(frame.assetId)
      .then((asset) => {
        if (!asset || cancelled) return;
        objectUrl = URL.createObjectURL(asset.blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(""));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [frame?.id, frame?.assetId, frame?.legacyDataUrl]);

  return url;
}

function FrameImage({
  frame,
  className = ""
}: {
  frame: AnimationFrame;
  className?: string;
}) {
  const url = useAssetUrl(frame);
  return url ? <img className={className} src={url} alt={frame.name} /> : null;
}

function Shell() {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <b>S</b>
          <span>
            <strong>SpriteForge</strong>
            <small>灵画 AI</small>
          </span>
        </div>

        <nav>
          {navigation.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({isActive}) => (isActive ? "active" : "")}
            >
              <i>{icon}</i>
              {label}
            </NavLink>
          ))}
        </nav>

        <footer>
          <em>IndexedDB</em>
          <small>大体积素材保存在本机数据库</small>
        </footer>
      </aside>

      <main>
        <header>
          <span>● Sprint 3 · 视频抽帧与素材数据库</span>
          <b>谢</b>
        </header>

        <section className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/animations" element={<Characters />} />
            <Route path="/sprites" element={<Characters />} />
            <Route path="/ai-studio" element={<AIStudio />} />
            <Route path="/unity" element={<Coming title="Unity 导出" sprint="Sprint 5" />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

function Dashboard() {
  const projects = useStore((state) => state.projects);
  const characters = useStore((state) => state.characters);
  const actions = useStore((state) => state.actions);
  const frames = useStore((state) => state.frames);
  const [storage, setStorage] = useState({usage: 0, quota: 0, ratio: 0});

  useEffect(() => {
    getStorageEstimate().then(setStorage).catch(() => undefined);
  }, [frames.length]);

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <label>本地游戏美术生产管线</label>
          <h1>现在可以直接把视频变成可编辑的序列帧。</h1>
          <p>
            视频在浏览器本地解码，帧图保存在 IndexedDB，不再受 LocalStorage
            的小容量限制。
          </p>
          <div className="actions">
            <Link className="primary" to="/animations">
              打开视频抽帧
            </Link>
            <Link className="secondary" to="/projects">
              管理项目
            </Link>
          </div>
        </div>

        <div className="flow storage-flow">
          <small>本地存储</small>
          <p>
            <b>{formatBytes(storage.usage)}</b> /{" "}
            {storage.quota ? formatBytes(storage.quota) : "浏览器配额"}
          </p>
          <div className="storage-bar">
            <i style={{width: `${Math.min(100, storage.ratio * 100)}%`}} />
          </div>
          <em>素材不会上传服务器</em>
        </div>
      </section>

      <section className="stats">
        {[
          ["项目", projects.length, "自动保存在本机"],
          ["人物", characters.length, "跨项目统一管理"],
          ["动作", actions.length, "已接入编辑器"],
          ["总帧数", frames.length, "IndexedDB 素材"]
        ].map((item) => (
          <article key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
            <small>{item[2]}</small>
          </article>
        ))}
      </section>

      <Panel title="最近项目">
        <div className="cards">
          {projects.slice(0, 4).map((project) => (
            <Link
              to={`/projects/${project.id}`}
              className="card"
              key={project.id}
            >
              <div className="cover">{project.name[0]}</div>
              <div>
                <strong>{project.name}</strong>
                <p>{project.description}</p>
                <small>
                  {
                    characters.filter(
                      (character) => character.projectId === project.id
                    ).length
                  }{" "}
                  个人物 · {project.frameSize}px · {project.fps}FPS
                </small>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({title, children}: {title: string; children: ReactNode}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Projects() {
  const projects = useStore((state) => state.projects);
  const createProject = useStore((state) => state.createProject);
  const removeProject = useStore((state) => state.deleteProject);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = createProject({
      name: String(form.get("name")),
      description: String(form.get("description") ?? ""),
      unityVersion: String(form.get("unityVersion")),
      frameSize: Number(form.get("frameSize")),
      fps: Number(form.get("fps"))
    });
    setOpen(false);
    navigate(`/projects/${projectId}`);
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`删除“${name}”及其全部人物和素材？`)) return;
    const assetIds = removeProject(id);
    await deleteAssets(assetIds);
  }

  return (
    <div className="stack">
      <Heading
        title="项目"
        desc="每个项目保存人物、规格与 Unity 导出设置。"
      >
        <button className="primary" onClick={() => setOpen(true)}>
          ＋ 新建项目
        </button>
      </Heading>

      <div className="list">
        {projects.map((project) => (
          <article key={project.id}>
            <Link to={`/projects/${project.id}`}>
              <div className="cover small">{project.name[0]}</div>
              <span>
                <strong>{project.name}</strong>
                <p>{project.description || "暂无说明"}</p>
                <small>
                  {project.unityVersion} · {project.frameSize}px · {project.fps}FPS
                </small>
              </span>
            </Link>
            <button
              className="danger"
              onClick={() => void remove(project.id, project.name)}
            >
              删除
            </button>
          </article>
        ))}
      </div>

      {open && (
        <Modal title="新建项目" close={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="项目名称">
              <input name="name" required placeholder="例如：三国角色项目" />
            </Field>
            <Field label="项目说明">
              <textarea name="description" rows={3} />
            </Field>
            <div className="grid">
              <Field label="Unity 版本">
                <select name="unityVersion">
                  <option>2022.3 LTS</option>
                  <option>Unity 6</option>
                </select>
              </Field>
              <Field label="默认尺寸">
                <select name="frameSize">
                  <option>256</option>
                  <option>512</option>
                  <option>1024</option>
                </select>
              </Field>
              <Field label="默认 FPS">
                <input
                  name="fps"
                  type="number"
                  defaultValue="12"
                  min="1"
                  max="60"
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setOpen(false)}
              >
                取消
              </button>
              <button className="primary">创建项目</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ProjectDetail() {
  const {id} = useParams();
  const projects = useStore((state) => state.projects);
  const characters = useStore((state) => state.characters);
  const createCharacter = useStore((state) => state.createCharacter);
  const removeCharacter = useStore((state) => state.deleteCharacter);
  const [open, setOpen] = useState(false);
  const project = projects.find((item) => item.id === id);

  if (!project) {
    return <Coming title="项目不存在" sprint="返回项目列表" />;
  }

  const projectCharacters = characters.filter(
    (character) => character.projectId === project.id
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createCharacter(
      project.id,
      String(form.get("name")),
      String(form.get("tags") ?? "")
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
    setOpen(false);
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`删除“${name}”及其全部动作和素材？`)) return;
    const assetIds = removeCharacter(id);
    await deleteAssets(assetIds);
  }

  return (
    <div className="stack">
      <Link className="crumb" to="/projects">
        项目 / {project.name}
      </Link>

      <section className="project-head">
        <div className="cover large">{project.name[0]}</div>
        <div>
          <label>{project.unityVersion}</label>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
          <small>
            {project.frameSize}px · {project.fps}FPS · {projectCharacters.length}{" "}
            个人物
          </small>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          ＋ 新建人物
        </button>
      </section>

      <Panel title="项目人物">
        <div className="char-grid">
          {projectCharacters.map((character) => (
            <article className="char" key={character.id}>
              <div>{character.name[0]}</div>
              <strong>{character.name}</strong>
              <p>{character.tags.join(" · ") || "暂无标签"}</p>
              <small>{character.actions} 个动作</small>
              <Link className="secondary compact" to="/characters">
                打开工作区
              </Link>
              <button
                className="danger"
                onClick={() => void remove(character.id, character.name)}
              >
                删除
              </button>
            </article>
          ))}
        </div>
      </Panel>

      {open && (
        <Modal title="新建人物" close={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="人物名称">
              <input name="name" required placeholder="例如：赵云" />
            </Field>
            <Field label="标签">
              <input name="tags" placeholder="三国，武将，长枪" />
            </Field>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setOpen(false)}
              >
                取消
              </button>
              <button className="primary">创建人物</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function readImageDimensions(blob: Blob): Promise<{width: number; height: number}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片解码失败"));
    };
    image.onload = () => {
      resolve({width: image.width, height: image.height});
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  errorName = "error"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = () => {
      cleanup();
      resolve();
    };
    const failure = () => {
      cleanup();
      reject(new Error(`媒体处理失败：${eventName}`));
    };
    const cleanup = () => {
      target.removeEventListener(eventName, success);
      target.removeEventListener(errorName, failure);
    };

    target.addEventListener(eventName, success, {once: true});
    target.addEventListener(errorName, failure, {once: true});
  });
}

async function extractVideoFrames(
  file: File,
  fps: number,
  maxFrames: number,
  onProgress: (done: number, total: number) => void
): Promise<
  Array<{
    blob: Blob;
    width: number;
    height: number;
    time: number;
    name: string;
  }>
> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const videoUrl = URL.createObjectURL(file);
  video.src = videoUrl;

  try {
    await waitForEvent(video, "loadedmetadata");

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) throw new Error("无法读取视频时长");

    const calculatedTotal = Math.max(1, Math.floor(duration * fps));
    const total = Math.min(maxFrames, calculatedTotal);
    const actualFps = calculatedTotal > maxFrames ? maxFrames / duration : fps;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", {alpha: true});
    if (!context) throw new Error("浏览器无法创建 Canvas");

    const results = [];

    for (let index = 0; index < total; index += 1) {
      const time = Math.min(duration - 0.001, index / actualFps);

      if (Math.abs(video.currentTime - time) > 0.0001) {
        video.currentTime = time;
        await waitForEvent(video, "seeked");
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("帧图编码失败")),
          "image/png"
        );
      });

      results.push({
        blob,
        width: canvas.width,
        height: canvas.height,
        time,
        name: `${file.name.replace(/\.[^.]+$/, "")}_${String(index + 1).padStart(
          4,
          "0"
        )}.png`
      });

      onProgress(index + 1, total);
    }

    return results;
  } finally {
    URL.revokeObjectURL(videoUrl);
    video.removeAttribute("src");
    video.load();
  }
}

function Characters() {
  const projects = useStore((state) => state.projects);
  const characters = useStore((state) => state.characters);
  const actions = useStore((state) => state.actions);
  const frames = useStore((state) => state.frames);
  const activeCharacterId = useStore((state) => state.activeCharacterId);
  const activeActionId = useStore((state) => state.activeActionId);

  const selectCharacter = useStore((state) => state.selectCharacter);
  const selectAction = useStore((state) => state.selectAction);
  const createAction = useStore((state) => state.createAction);
  const updateAction = useStore((state) => state.updateAction);
  const removeAction = useStore((state) => state.deleteAction);
  const addFrames = useStore((state) => state.addFrames);
  const updateFrame = useStore((state) => state.updateFrame);
  const removeFrame = useStore((state) => state.deleteFrame);
  const moveFrame = useStore((state) => state.moveFrame);
  const toggleEnabled = useStore((state) => state.toggleFrameEnabled);
  const setAllEnabled = useStore((state) => state.setAllFramesEnabled);
  const setEnablePattern = useStore((state) => state.setFrameEnablePattern);
  const toggleSelected = useStore((state) => state.toggleFrameSelected);
  const setAllSelected = useStore((state) => state.setAllFramesSelected);
  const removeSelected = useStore((state) => state.deleteSelectedFrames);
  const clearFrames = useStore((state) => state.clearActionFrames);

  const [actionModal, setActionModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState("");
  const [progress, setProgress] = useState({done: 0, total: 0});

  const character =
    characters.find((item) => item.id === activeCharacterId) ?? characters[0];
  const characterActions = actions.filter(
    (action) => action.characterId === character?.id
  );
  const action =
    characterActions.find((item) => item.id === activeActionId) ??
    characterActions[0];

  const actionFrames = useMemo(
    () =>
      frames
        .filter((frame) => frame.actionId === action?.id)
        .sort((a, b) => a.order - b.order),
    [frames, action?.id]
  );

  const enabledFrames = actionFrames.filter((frame) => frame.enabled);
  const selectedFrames = actionFrames.filter((frame) => frame.selected);
  const selectedFrame = actionFrames.find(
    (frame) => frame.id === selectedFrameId
  );
  const currentFrame = enabledFrames[playIndex] ?? enabledFrames[0];

  useEffect(() => {
    setPlayIndex(0);
    setPlaying(false);
    setSelectedFrameId(null);
  }, [action?.id]);

  useEffect(() => {
    if (!playing || enabledFrames.length < 2 || !action) return;

    const timer = window.setInterval(() => {
      setPlayIndex((current) => {
        const next = current + 1;
        if (next < enabledFrames.length) return next;
        if (action.loop) return 0;
        setPlaying(false);
        return enabledFrames.length - 1;
      });
    }, Math.max(16, Math.round(1000 / action.fps)));

    return () => window.clearInterval(timer);
  }, [playing, enabledFrames.length, action?.fps, action?.loop]);

  async function importImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    event.target.value = "";
    if (!action || files.length === 0) return;

    setError("");
    setProcessing("正在保存图片序列…");

    try {
      const sorted = files.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {numeric: true})
      );

      const assets: StoredAsset[] = [];
      const metadata: Array<
        Omit<AnimationFrame, "id" | "order" | "selected">
      > = [];

      for (const file of sorted) {
        const assetId = createId("asset");
        const dimensions = await readImageDimensions(file);

        assets.push({
          id: assetId,
          blob: file,
          kind: "image",
          fileName: file.name,
          mimeType: file.type || "image/png",
          createdAt: new Date().toISOString()
        });

        metadata.push({
          actionId: action.id,
          name: file.name,
          assetId,
          width: dimensions.width,
          height: dimensions.height,
          enabled: true,
          source: "image"
        });
      }

      await saveAssets(assets);
      addFrames(metadata);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "图片导入失败");
    } finally {
      setProcessing("");
    }
  }

  async function importVideo(
    file: File,
    extractionFps: number,
    maxFrames: number
  ) {
    if (!action) return;

    setVideoModal(false);
    setError("");
    setProcessing("正在本地解码视频…");
    setProgress({done: 0, total: 0});

    try {
      const extracted = await extractVideoFrames(
        file,
        extractionFps,
        maxFrames,
        (done, total) => setProgress({done, total})
      );

      setProcessing("正在保存抽取的帧…");

      const assets: StoredAsset[] = [];
      const metadata: Array<
        Omit<AnimationFrame, "id" | "order" | "selected">
      > = [];

      extracted.forEach((item) => {
        const assetId = createId("asset");

        assets.push({
          id: assetId,
          blob: item.blob,
          kind: "video-frame",
          fileName: item.name,
          mimeType: "image/png",
          createdAt: new Date().toISOString()
        });

        metadata.push({
          actionId: action.id,
          name: item.name,
          assetId,
          width: item.width,
          height: item.height,
          enabled: true,
          source: "video",
          sourceTime: item.time
        });
      });

      await saveAssets(assets);
      addFrames(metadata);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "视频抽帧失败");
    } finally {
      setProcessing("");
      setProgress({done: 0, total: 0});
    }
  }

  function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!character) return;
    const form = new FormData(event.currentTarget);

    createAction(
      character.id,
      String(form.get("name")),
      String(form.get("direction")),
      Number(form.get("fps")),
      form.get("loop") === "on"
    );
    setActionModal(false);
  }

  async function deleteCurrentFrame() {
    if (!selectedFrame) return;
    const assetId = removeFrame(selectedFrame.id);
    if (assetId) await deleteAsset(assetId);
    setSelectedFrameId(null);
  }

  async function deleteSelected() {
    if (!action || selectedFrames.length === 0) return;
    if (!window.confirm(`删除选中的 ${selectedFrames.length} 帧？`)) return;
    const assetIds = removeSelected(action.id);
    await deleteAssets(assetIds);
    setSelectedFrameId(null);
  }

  async function deleteAllFrames() {
    if (!actionFrames.length || !action) return;
    if (!window.confirm(`清空动作“${action.name}”的全部 ${actionFrames.length} 帧？`))
      return;
    const assetIds = clearFrames(action.id);
    await deleteAssets(assetIds);
    setSelectedFrameId(null);
  }

  async function deleteCurrentAction() {
    if (!action) return;
    if (!window.confirm(`删除动作“${action.name}”及其全部帧？`)) return;
    const assetIds = removeAction(action.id);
    await deleteAssets(assetIds);
  }

  return (
    <div className="workspace sprint3-workspace">
      <section className="library">
        <h2>人物库</h2>

        {characters.map((item) => (
          <button
            className={item.id === character?.id ? "selected" : ""}
            key={item.id}
            onClick={() => selectCharacter(item.id)}
          >
            <i>{item.name[0]}</i>
            <span>
              <strong>{item.name}</strong>
              <small>
                {
                  projects.find((project) => project.id === item.projectId)
                    ?.name
                }
              </small>
            </span>
          </button>
        ))}

        <div className="action-head">
          <b>动作</b>
          <button onClick={() => setActionModal(true)}>＋</button>
        </div>

        <div className="action-list">
          {characterActions.map((item) => (
            <button
              className={item.id === action?.id ? "selected" : ""}
              key={item.id}
              onClick={() => selectAction(item.id)}
            >
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.direction} · {item.fps}FPS
                </small>
              </span>
              <em>
                {frames.filter((frame) => frame.actionId === item.id).length}
              </em>
            </button>
          ))}
        </div>
      </section>

      <section className="canvas">
        <header>
          <span>
            <button
              onClick={() => setPlaying((value) => !value)}
              disabled={!enabledFrames.length}
            >
              {playing ? "暂停" : "播放"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setPlayIndex(0);
              }}
            >
              停止
            </button>
          </span>
          <span>
            {action
              ? `${action.name} · ${action.fps} FPS · ${actionFrames.length} 帧`
              : "未选择动作"}
          </span>
        </header>

        <div className="stage">
          {currentFrame ? (
            <div className="preview">
              <FrameImage frame={currentFrame} />
              <small>
                {playIndex + 1} / {enabledFrames.length}
              </small>
            </div>
          ) : (
            <div className="placeholder">
              <b>{character?.name[0] ?? "?"}</b>
              <strong>{character?.name ?? "请先创建人物"}</strong>
              <small>
                {action
                  ? "导入图片序列或直接从视频抽帧"
                  : "请先新建动作"}
              </small>
            </div>
          )}
        </div>

        <footer className="timeline">
          <div className="timeline-head sprint3-tools">
            <span>
              <strong>动作时间轴</strong>
              <small>
                播放启用 {enabledFrames.length} / {actionFrames.length} 帧 · 删除勾选 {selectedFrames.length}
              </small>
            </span>

            <span>
              <input
                id="spriteforge-image-import"
                className="native-file-input"
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={importImages}
                disabled={!action || Boolean(processing)}
              />
              <label
                htmlFor={action ? "spriteforge-image-import" : undefined}
                className={`secondary compact import-label ${
                  !action || processing ? "disabled" : ""
                }`}
              >
                导入图片
              </label>
              <button
                className="primary compact"
                disabled={!action || Boolean(processing)}
                onClick={() => setVideoModal(true)}
              >
                视频抽帧
              </button>
            </span>
          </div>

          {processing && (
            <div className="processing-banner">
              <span>{processing}</span>
              {progress.total > 0 && (
                <b>
                  {progress.done} / {progress.total}
                </b>
              )}
            </div>
          )}
          {error && <div className="inline-error">{error}</div>}

          <div className="batch-toolbar">
            <span className="batch-toolbar-label">播放启用</span>
            <button
              onClick={() => action && setAllEnabled(action.id, true)}
              disabled={!actionFrames.length}
            >
              全选
            </button>
            <button
              onClick={() => action && setAllEnabled(action.id, false)}
              disabled={!actionFrames.length}
            >
              全不选
            </button>
            <button
              onClick={() => action && setEnablePattern(action.id, 1)}
              disabled={!actionFrames.length}
              title="保留第 1、3、5、7… 帧"
            >
              隔 1 帧抽
            </button>
            <button
              onClick={() => action && setEnablePattern(action.id, 2)}
              disabled={!actionFrames.length}
              title="保留第 1、4、7、10… 帧"
            >
              隔 2 帧抽
            </button>
            <span className="batch-toolbar-separator" />
            <button
              className="danger"
              onClick={() => void deleteSelected()}
              disabled={!selectedFrames.length}
            >
              删除勾选
            </button>
            <button
              className="danger"
              onClick={() => void deleteAllFrames()}
              disabled={!actionFrames.length}
            >
              清空
            </button>
          </div>

          <div className="frame-track sprint3-track">
            {actionFrames.length ? (
              actionFrames.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`frame-wrap ${frame.selected ? "checked" : ""}`}
                >
                  <button
                    className={`frame ${
                      frame.id === selectedFrameId ? "selected" : ""
                    } ${!frame.enabled ? "disabled" : ""}`}
                    onClick={() => {
                      setSelectedFrameId(frame.id);
                      const enabledIndex = enabledFrames.findIndex(
                        (item) => item.id === frame.id
                      );
                      if (enabledIndex >= 0) setPlayIndex(enabledIndex);
                    }}
                  >
                    <FrameImage frame={frame} />
                    <small>{index + 1}</small>
                    {frame.source === "video" && <em>VIDEO</em>}
                  </button>
                  <label className="frame-enable-toggle" title="播放时启用该帧">
                    <input
                      type="checkbox"
                      checked={frame.enabled}
                      onChange={() => toggleEnabled(frame.id)}
                    />
                    <span>启用</span>
                  </label>
                  <label className="frame-delete-toggle" title="勾选后可批量删除">
                    <input
                      type="checkbox"
                      checked={frame.selected}
                      onChange={() => toggleSelected(frame.id)}
                    />
                  </label>
                </div>
              ))
            ) : (
              <p>
                导入 PNG/JPG/WebP，或点击“视频抽帧”从 MP4/WebM/MOV
                生成序列帧。
              </p>
            )}
          </div>
        </footer>
      </section>

      <section className="props">
        <h2>{selectedFrame ? "帧设置" : "动作设置"}</h2>

        {selectedFrame ? (
          <>
            <Field label="文件">
              <input readOnly value={selectedFrame.name} />
            </Field>
            <Field label="尺寸">
              <input
                readOnly
                value={`${selectedFrame.width} × ${selectedFrame.height}`}
              />
            </Field>
            <Field label="来源">
              <input
                readOnly
                value={
                  selectedFrame.source === "video"
                    ? `视频 ${
                        selectedFrame.sourceTime?.toFixed(3) ?? "0.000"
                      } 秒`
                    : "图片"
                }
              />
            </Field>

            <label className="check">
              <input
                type="checkbox"
                checked={selectedFrame.enabled}
                onChange={(event) =>
                  updateFrame(selectedFrame.id, {
                    enabled: event.target.checked
                  })
                }
              />
              <span>播放时启用此帧</span>
            </label>

            <div className="two">
              <button
                className="secondary"
                onClick={() => moveFrame(selectedFrame.id, -1)}
              >
                ← 前移
              </button>
              <button
                className="secondary"
                onClick={() => moveFrame(selectedFrame.id, 1)}
              >
                后移 →
              </button>
            </div>

            <button
              className="danger-box"
              onClick={() => void deleteCurrentFrame()}
            >
              删除当前帧
            </button>
          </>
        ) : action ? (
          <>
            <Field label="动作名称">
              <input
                value={action.name}
                onChange={(event) =>
                  updateAction(action.id, {name: event.target.value})
                }
              />
            </Field>
            <Field label="方向">
              <select
                value={action.direction}
                onChange={(event) =>
                  updateAction(action.id, {direction: event.target.value})
                }
              >
                <option value="south">South / 正面</option>
                <option value="north">North / 背面</option>
                <option value="east">East / 右侧</option>
                <option value="west">West / 左侧</option>
                <option value="none">无方向</option>
              </select>
            </Field>
            <Field label="播放 FPS">
              <input
                type="number"
                min="1"
                max="60"
                value={action.fps}
                onChange={(event) =>
                  updateAction(action.id, {fps: Number(event.target.value)})
                }
              />
            </Field>

            <label className="check">
              <input
                type="checkbox"
                checked={action.loop}
                onChange={(event) =>
                  updateAction(action.id, {loop: event.target.checked})
                }
              />
              <span>循环播放</span>
            </label>

            <button
              className="danger-box"
              onClick={() => void deleteCurrentAction()}
            >
              删除动作
            </button>
          </>
        ) : (
          <p className="muted">创建动作后才能导入图片或视频。</p>
        )}
      </section>

      {actionModal && character && (
        <Modal
          title={`为 ${character.name} 新建动作`}
          close={() => setActionModal(false)}
        >
          <form onSubmit={submitAction}>
            <Field label="动作名称">
              <input
                name="name"
                required
                placeholder="例如：攻击、蓄力、待机"
              />
            </Field>
            <div className="grid">
              <Field label="方向">
                <select name="direction">
                  <option value="south">South / 正面</option>
                  <option value="north">North / 背面</option>
                  <option value="east">East / 右侧</option>
                  <option value="west">West / 左侧</option>
                  <option value="none">无方向</option>
                </select>
              </Field>
              <Field label="FPS">
                <input
                  name="fps"
                  type="number"
                  min="1"
                  max="60"
                  defaultValue="12"
                />
              </Field>
            </div>
            <label className="check">
              <input name="loop" type="checkbox" defaultChecked />
              <span>循环播放</span>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setActionModal(false)}
              >
                取消
              </button>
              <button className="primary">创建动作</button>
            </div>
          </form>
        </Modal>
      )}

      {videoModal && action && (
        <VideoImportModal
          close={() => setVideoModal(false)}
          defaultFps={action.fps}
          submit={(file, fps, maxFrames) =>
            void importVideo(file, fps, maxFrames)
          }
        />
      )}
    </div>
  );
}

function VideoImportModal({
  close,
  defaultFps,
  submit
}: {
  close: () => void;
  defaultFps: number;
  submit: (file: File, fps: number, maxFrames: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    const form = new FormData(event.currentTarget);
    submit(file, Number(form.get("fps")), Number(form.get("maxFrames")));
  }

  return (
    <Modal title="从视频抽取序列帧" close={close}>
      <form onSubmit={handleSubmit}>
        <Field label="视频文件">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>

        <div className="video-file-info">
          {file ? (
            <>
              <strong>{file.name}</strong>
              <small>{formatBytes(file.size)}</small>
            </>
          ) : (
            <span>请选择 MP4、WebM 或浏览器可解码的 MOV</span>
          )}
        </div>

        <div className="grid">
          <Field label="抽帧 FPS">
            <input
              name="fps"
              type="number"
              min="1"
              max="30"
              defaultValue={Math.min(defaultFps, 24)}
            />
          </Field>
          <Field label="最多抽取">
            <input
              name="maxFrames"
              type="number"
              min="1"
              max="600"
              defaultValue="240"
            />
          </Field>
        </div>

        <p className="form-note">
          视频仅在本机浏览器中处理。长视频会自动按“最多抽取”限制降低采样密度。
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={close}>
            取消
          </button>
          <button className="primary" disabled={!file}>
            开始抽帧
          </button>
        </div>
      </form>
    </Modal>
  );
}


function createMockCharacterBlob(
  title: string,
  style: string,
  direction: string,
  variant: number,
  size: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("无法创建生成画布"));

  const hue = (variant * 67 + title.length * 19) % 360;
  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, `hsl(${hue} 55% 18%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360} 65% 8%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = "rgba(255,255,255,.08)";
  for (let i = 0; i < 12; i += 1) {
    context.beginPath();
    context.arc(
      (i * 83 + variant * 41) % size,
      (i * 57 + variant * 29) % size,
      size * 0.035,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  const cx = size / 2;
  const baseY = size * 0.82;

  context.save();
  context.translate(cx, baseY);
  if (direction === "side") context.scale(0.82, 1);

  context.fillStyle = `hsl(${(hue + 25) % 360} 70% 58%)`;
  context.beginPath();
  context.ellipse(0, -size * 0.22, size * 0.17, size * 0.25, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = `hsl(${(hue + 180) % 360} 55% 46%)`;
  context.fillRect(-size * 0.16, -size * 0.18, size * 0.32, size * 0.32);

  context.fillStyle = "#f4c8a4";
  context.beginPath();
  context.arc(0, -size * 0.43, size * 0.105, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#e9ecff";
  context.lineWidth = Math.max(3, size * 0.012);
  context.beginPath();
  context.moveTo(size * 0.17, -size * 0.2);
  context.lineTo(size * 0.31, -size * 0.5);
  context.stroke();

  context.restore();

  context.fillStyle = "rgba(7,9,15,.76)";
  context.fillRect(0, size - 72, size, 72);
  context.fillStyle = "#ffffff";
  context.font = `700 ${Math.max(18, size * 0.045)}px Inter, sans-serif`;
  context.fillText(title || "AI Character", 20, size - 40);
  context.fillStyle = "#aab2c7";
  context.font = `500 ${Math.max(12, size * 0.026)}px Inter, sans-serif`;
  context.fillText(`${style} · ${direction} · Mock ${variant + 1}`, 20, size - 16);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("生成结果编码失败")),
      "image/png"
    )
  );
}

function AIStudio() {
  const projects = useStore((state) => state.projects);
  const generations = useStore((state) => state.generations);
  const createGenerationTask = useStore((state) => state.createGenerationTask);
  const updateGenerationTask = useStore((state) => state.updateGenerationTask);
  const removeGenerationTask = useStore((state) => state.deleteGenerationTask);
  const setGenerationResult = useStore((state) => state.setGenerationResult);

  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(
    generations[0]?.id ?? null
  );
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? "",
    characterName: "关羽",
    templateId: "three-kingdoms-general" as CharacterTemplateId,
    manualPrompt:
      "丹凤眼，卧蚕眉，长髯，绿色战袍，手持完整青龙偃月刀，威严但适合休闲手游",
    negativePrompt: getCharacterTemplate("three-kingdoms-general").negativePrompt,
    style: "Chinese Adventure",
    resolution: 512,
    candidateCount: 2,
    direction: "front" as "front" | "back" | "side",
    seed: 12345,
    consistency: 80,
    providerId: "mock" as "mock" | "spriteforge-server"
  });

  const finalPrompt = useMemo(
    () =>
      buildCharacterPrompt({
        templateId: form.templateId,
        characterName: form.characterName,
        manualPrompt: form.manualPrompt,
        direction: form.direction,
        resolution: form.resolution,
        style: form.style
      }),
    [
      form.templateId,
      form.characterName,
      form.manualPrompt,
      form.direction,
      form.resolution,
      form.style
    ]
  );

  const activeTask =
    generations.find((task) => task.id === activeTaskId) ?? generations[0];

  useEffect(() => {
    if (!activeTaskId && generations[0]) setActiveTaskId(generations[0].id);
  }, [generations.length, activeTaskId]);

  useEffect(() => {
    if (!referenceFile) {
      setReferencePreview("");
      return;
    }
    const url = URL.createObjectURL(referenceFile);
    setReferencePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceFile]);

  async function startCharacterGeneration() {
    if (!form.projectId || !form.characterName.trim() || !finalPrompt.trim()) {
      window.alert("请填写项目、角色名称和 Prompt。");
      return;
    }

    setBusy(true);
    let referenceAssetId: string | undefined;

    try {
      if (referenceFile) {
        referenceAssetId = createId("asset");
        await saveAssets([
          {
            id: referenceAssetId,
            blob: referenceFile,
            kind: "image",
            fileName: referenceFile.name,
            mimeType: referenceFile.type || "image/png",
            createdAt: new Date().toISOString()
          }
        ]);
      }

      const taskId = createGenerationTask({
        projectId: form.projectId,
        characterName: form.characterName,
        prompt: finalPrompt,
        manualPrompt: form.manualPrompt,
        finalPrompt,
        templateId: form.templateId,
        providerId: form.providerId,
        negativePrompt: form.negativePrompt,
        style: form.style,
        resolution: form.resolution,
        direction: form.direction,
        seed: form.seed,
        consistency: form.consistency,
        referenceAssetId
      });
      setActiveTaskId(taskId);
      setActiveTab("history");

      updateGenerationTask(taskId, {status: "running", progress: 8});

      const resultAssetIds: string[] = [];
      const candidateCount =
        form.providerId === "spriteforge-server" ? form.candidateCount : 4;

      if (form.providerId === "spriteforge-server" && spriteForgeServerProvider.generateStream) {
        await spriteForgeServerProvider.generateStream(
          {
            prompt: finalPrompt,
            negativePrompt: form.negativePrompt,
            size: form.resolution,
            count: candidateCount,
            referenceImage: referenceFile ?? undefined
          },
          async (result, index, total) => {
            const assetId = createId("asset");
            resultAssetIds[index] = assetId;

            await saveAssets([
              {
                id: assetId,
                blob: result.blob,
                kind: "image",
                fileName: `${form.characterName}_${form.direction}_${index + 1}.png`,
                mimeType: "image/png",
                createdAt: new Date().toISOString()
              }
            ]);

            const validIds = resultAssetIds.filter(Boolean);
            updateGenerationTask(taskId, {
              progress: Math.round(89 + (validIds.length / total) * 11),
              resultAssetIds: [...validIds],
              selectedResultAssetId: validIds[0]
            });
          }
        );
      } else {
        const generated = await Promise.all(
          Array.from({length: candidateCount}, async (_, variant) => ({
            blob: await createMockCharacterBlob(
              form.characterName,
              form.style,
              form.direction,
              variant,
              form.resolution
            )
          }))
        );

        const assets: StoredAsset[] = [];
        generated.forEach((result, variant) => {
          const assetId = createId("asset");
          resultAssetIds.push(assetId);
          assets.push({
            id: assetId,
            blob: result.blob,
            kind: "image",
            fileName: `${form.characterName}_${form.direction}_${variant + 1}.png`,
            mimeType: "image/png",
            createdAt: new Date().toISOString()
          });
        });

        await saveAssets(assets);
      }

      updateGenerationTask(taskId, {
        status: "completed",
        progress: 100,
        resultAssetIds: resultAssetIds.filter(Boolean),
        selectedResultAssetId: resultAssetIds.filter(Boolean)[0]
      });
    } catch (reason) {
      const latestId = useStore.getState().generations[0]?.id;
      if (latestId) {
        updateGenerationTask(latestId, {
          status: "failed",
          error: reason instanceof Error ? reason.message : "生成失败"
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeTask(task: CharacterGeneration) {
    if (!window.confirm(`删除“${task.characterName}”这次生成任务？`)) return;
    const assetIds = removeGenerationTask(task.id);
    if (task.referenceAssetId) assetIds.push(task.referenceAssetId);
    await deleteAssets(assetIds);
    if (activeTaskId === task.id) setActiveTaskId(null);
  }

  return (
    <div className="ai-studio">
      <section className="ai-topbar">
        <div>
          <label>SpriteForge AI Studio</label>
          <h1>角色生成工作台</h1>
          <p>Prompt / 参考图 → 角色候选图 → 选为角色基准 → 进入图生视频动作生成</p>
        </div>
        <div className="ai-tabs">
          <button
            className={activeTab === "create" ? "active" : ""}
            onClick={() => setActiveTab("create")}
          >
            创建角色
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            生成历史
            <em>{generations.length}</em>
          </button>
        </div>
      </section>

      {activeTab === "create" ? (
        <div className="ai-layout">
          <section className="ai-form-panel">
            <div className="ai-section-title">
              <span>01</span>
              <div>
                <strong>生成设置</strong>
                <small>模板 + 手动 Prompt，可切换 Mock 或真实 AI Provider</small>
              </div>
            </div>

            <Field label="所属项目">
              <select
                value={form.projectId}
                onChange={(event) =>
                  setForm({...form, projectId: event.target.value})
                }
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="角色名称">
              <input
                value={form.characterName}
                onChange={(event) =>
                  setForm({...form, characterName: event.target.value})
                }
              />
            </Field>

            <Field label="角色模板">
              <select
                value={form.templateId}
                onChange={(event) => {
                  const templateId = event.target.value as CharacterTemplateId;
                  const template = getCharacterTemplate(templateId);
                  setForm({
                    ...form,
                    templateId,
                    style: template.defaultStyle,
                    negativePrompt: template.negativePrompt
                  });
                }}
              >
                {characterTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} — {template.description}
                  </option>
                ))}
              </select>
            </Field>

            <div className="template-preview">
              <strong>{getCharacterTemplate(form.templateId).name}</strong>
              <p>{getCharacterTemplate(form.templateId).prompt || "不添加模板内容"}</p>
            </div>

            <Field label="手动 Prompt（会追加到模板后）">
              <textarea
                rows={5}
                value={form.manualPrompt}
                onChange={(event) =>
                  setForm({...form, manualPrompt: event.target.value})
                }
                placeholder="例如：丹凤眼、长髯、绿色战袍、青龙偃月刀……"
              />
            </Field>

            <Field label="最终 Prompt 预览">
              <textarea rows={7} value={finalPrompt} readOnly />
            </Field>

            <Field label="Negative Prompt">
              <textarea
                rows={3}
                value={form.negativePrompt}
                onChange={(event) =>
                  setForm({...form, negativePrompt: event.target.value})
                }
              />
            </Field>

            <div className="grid">
              <Field label="风格">
                <select
                  value={form.style}
                  onChange={(event) => setForm({...form, style: event.target.value})}
                >
                  <option>3D Casual</option>
                  <option>Voodoo Style</option>
                  <option>Stylized Fantasy</option>
                  <option>Chinese Adventure</option>
                  <option>Custom</option>
                </select>
              </Field>
              <Field label="方向">
                <select
                  value={form.direction}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      direction: event.target.value as "front" | "back" | "side"
                    })
                  }
                >
                  <option value="front">Front / 正面</option>
                  <option value="back">Back / 背面</option>
                  <option value="side">Side / 侧面</option>
                </select>
              </Field>
            </div>

            <div className="grid">
              <Field label="分辨率">
                <select
                  value={form.resolution}
                  onChange={(event) =>
                    setForm({...form, resolution: Number(event.target.value)})
                  }
                >
                  <option value="256">256 × 256</option>
                  <option value="512">512 × 512</option>
                  <option value="1024">1024 × 1024</option>
                </select>
              </Field>
              {form.providerId === "spriteforge-server" && (
                <Field label="候选数量">
                  <select
                    value={form.candidateCount}
                    onChange={(event) =>
                      setForm({...form, candidateCount: Number(event.target.value)})
                    }
                  >
                    <option value="1">1 张（最快）</option>
                    <option value="2">2 张（推荐）</option>
                    <option value="4">4 张（较慢）</option>
                  </select>
                </Field>
              )}
              <Field label="Seed">
                <input
                  type="number"
                  value={form.seed}
                  onChange={(event) =>
                    setForm({...form, seed: Number(event.target.value)})
                  }
                />
              </Field>
            </div>

            <Field label={`一致性强度：${form.consistency}%`}>
              <input
                type="range"
                min="0"
                max="100"
                value={form.consistency}
                onChange={(event) =>
                  setForm({...form, consistency: Number(event.target.value)})
                }
              />
            </Field>

            <Field label="生成服务">
              <select
                value={form.providerId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    providerId: event.target.value as "mock" | "spriteforge-server"
                  })
                }
              >
                <option value="mock">Mock Provider（本地流程测试）</option>
                <option value="spriteforge-server">
                  SpriteForge Server（真实 AI）
                </option>
              </select>
            </Field>

            {form.providerId === "spriteforge-server" && (
              <div className="provider-notice">
                <strong>真实 AI 模式</strong>
                <p>
                  请求会发送到本机或部署后的 `/api/character/generate`。
                  API Key 只保存在后端环境变量中，不会写入浏览器。
                </p>
              </div>
            )}

            <button
              className="primary ai-generate-button"
              disabled={busy}
              onClick={() => void startCharacterGeneration()}
            >
              {busy
                ? "正在创建生成任务…"
                : form.providerId === "mock"
                  ? "✦ 生成 4 个测试候选"
                  : `✦ 使用真实 AI 生成 ${form.candidateCount} 个候选`}
            </button>
          </section>

          <section className="ai-preview-panel">
            <div className="ai-section-title">
              <span>02</span>
              <div>
                <strong>参考图</strong>
                <small>可选，用于保持角色外观与配色</small>
              </div>
            </div>

            <label className="reference-drop">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/*"
                onChange={(event) =>
                  setReferenceFile(event.target.files?.[0] ?? null)
                }
              />
              {referencePreview ? (
                <img src={referencePreview} alt="参考图" />
              ) : (
                <div>
                  <b>＋</b>
                  <strong>上传参考角色图</strong>
                  <small>PNG / JPG / WebP</small>
                </div>
              )}
            </label>

            {referenceFile && (
              <div className="reference-file">
                <span>
                  <strong>{referenceFile.name}</strong>
                  <small>{formatBytes(referenceFile.size)}</small>
                </span>
                <button onClick={() => setReferenceFile(null)}>移除</button>
              </div>
            )}

            <div className="pipeline-card">
              <strong>当前生产链路</strong>
              <div>
                <span className="done">角色生成</span>
                <i>→</i>
                <span>图生视频</span>
                <i>→</i>
                <span>自动抽帧</span>
                <i>→</i>
                <span>帧后处理</span>
              </div>
              <small>本 Sprint 先打通角色生成任务与结果选择。</small>
            </div>
          </section>

          <section className="ai-queue-panel">
            <div className="ai-section-title">
              <span>03</span>
              <div>
                <strong>任务队列</strong>
                <small>统一任务状态与 Provider 状态流转</small>
              </div>
            </div>

            <div className="queue-list">
              {generations.length ? (
                generations.slice(0, 6).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setActiveTaskId(task.id);
                      setActiveTab("history");
                    }}
                  >
                    <i className={`status-dot ${task.status}`} />
                    <span>
                      <strong>{task.characterName}</strong>
                      <small>{task.style} · {task.direction}</small>
                    </span>
                    <em>{task.progress}%</em>
                  </button>
                ))
              ) : (
                <div className="queue-empty">
                  <b>◎</b>
                  <strong>还没有生成任务</strong>
                  <small>配置角色后点击生成</small>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="history-layout">
          <section className="history-list">
            <div className="ai-section-title">
              <span>H</span>
              <div>
                <strong>生成历史</strong>
                <small>角色生成任务与候选结果</small>
              </div>
            </div>

            {generations.length ? (
              generations.map((task) => (
                <button
                  key={task.id}
                  className={task.id === activeTask?.id ? "active" : ""}
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <i className={`status-dot ${task.status}`} />
                  <span>
                    <strong>{task.characterName}</strong>
                    <small>
                      {task.style} · {task.resolution}px · {task.direction}
                    </small>
                  </span>
                  <em>{task.progress}%</em>
                </button>
              ))
            ) : (
              <div className="queue-empty">
                <b>◎</b>
                <strong>暂无生成历史</strong>
                <small>先创建一个角色生成任务</small>
              </div>
            )}
          </section>

          <section className="history-detail">
            {activeTask ? (
              <>
                <div className="history-head">
                  <div>
                    <label>{activeTask.status}</label>
                    <h2>{activeTask.characterName}</h2>
                    <p>{activeTask.prompt}</p>
                  </div>
                  <button
                    className="danger"
                    onClick={() => void removeTask(activeTask)}
                  >
                    删除任务
                  </button>
                </div>

                {activeTask.status !== "completed" ? (
                  <div className="generation-progress">
                    <div>
                      <b>{activeTask.progress}%</b>
                      <span>AI 生成中</span>
                    </div>
                    <div className="progress-track">
                      <i style={{width: `${activeTask.progress}%`}} />
                    </div>
                    <small>
                      {activeTask.status === "failed"
                        ? activeTask.error
                        : "AI Provider 正在生成角色候选图…"}
                    </small>
                  </div>
                ) : (
                  <>
                    <div className="result-toolbar">
                      <span>
                        <strong>候选结果</strong>
                        <small>选择一张作为角色基准图</small>
                      </span>
                      <button className="secondary">重新生成</button>
                    </div>

                    <div className="result-grid">
                      {activeTask.resultAssetIds.map((assetId, index) => (
                        <GenerationResultCard
                          key={assetId}
                          assetId={assetId}
                          index={index}
                          selected={activeTask.selectedResultAssetId === assetId}
                          onSelect={() => setGenerationResult(activeTask.id, assetId)}
                        />
                      ))}
                    </div>

                    <div className="selected-result-bar">
                      <span>
                        <strong>角色基准图</strong>
                        <small>
                          {activeTask.selectedResultAssetId
                            ? "已选择，可进入动作生成"
                            : "请选择一个候选结果"}
                        </small>
                      </span>
                      <button
                        className="primary"
                        disabled={!activeTask.selectedResultAssetId}
                        onClick={() =>
                          window.alert(
                            "Sprint 4R-B 将从这里进入 Image-to-Video 动作生成工作台。"
                          )
                        }
                      >
                        进入动作生成 →
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="history-empty">
                <b>✦</b>
                <h2>选择一个生成任务</h2>
                <p>查看生成状态、角色候选图和角色基准图。</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function GenerationResultCard({
  assetId,
  index,
  selected,
  onSelect
}: {
  assetId: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let objectUrl = "";
    getAsset(assetId).then((asset) => {
      if (!asset) return;
      objectUrl = URL.createObjectURL(asset.blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);

  return (
    <button
      className={`generation-result ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div>{url && <img src={url} alt={`候选结果 ${index + 1}`} />}</div>
      <span>
        <strong>Result {index + 1}</strong>
        <small>{selected ? "角色基准图" : "点击选择"}</small>
      </span>
      {selected && <em>✓</em>}
    </button>
  );
}

function Heading({
  title,
  desc,
  children
}: {
  title: string;
  desc: string;
  children?: ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <label>Workspace</label>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Coming({title, sprint}: {title: string; sprint: string}) {
  return (
    <div className="stack">
      <Heading
        title={title}
        desc="模块入口已经预留，后续直接接入项目与人物数据。"
      />
      <section className="coming">
        <b>✦</b>
        <label>{sprint}</label>
        <h2>开发计划已排期</h2>
        <p>当前 Sprint 优先打通视频、素材数据库和批量帧管理。</p>
      </section>
    </div>
  );
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  close
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div className="backdrop" onMouseDown={close}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button onClick={close}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

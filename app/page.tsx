"use client";

import { useEffect, useMemo, useState } from "react";
import { LEVELS } from "./levels";

type GameStatus = "setup" | "running" | "success" | "failure";

const STARTING_ENERGY = 100;
const STORAGE_KEY = "left-foot-right-foot-completed";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeEmptyAllocation(levelIndex: number) {
  return LEVELS[levelIndex].machines.map(() => 0);
}

function getLoopRate(levelIndex: number, allocation: number[]) {
  return LEVELS[levelIndex].machines.reduce(
    (product, machine, index) =>
      product * machine.rates[allocation[index]],
    1,
  );
}

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [allocation, setAllocation] = useState(() => makeEmptyAllocation(0));
  const [status, setStatus] = useState<GameStatus>("setup");
  const [activeMachine, setActiveMachine] = useState(-1);
  const [energy, setEnergy] = useState(STARTING_ENERGY);
  const [cycle, setCycle] = useState(0);
  const [log, setLog] = useState("等待配置");
  const [completed, setCompleted] = useState<number[]>([]);

  const level = LEVELS[levelIndex];
  const used = allocation.reduce((sum, value) => sum + value, 0);
  const remaining = level.budget - used;
  const loopRate = useMemo(
    () => getLoopRate(levelIndex, allocation),
    [allocation, levelIndex],
  );
  const maxCompleted = completed.length ? Math.max(...completed) : 0;
  const highestUnlocked = Math.min(LEVELS.length, maxCompleted + 1);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) {
        const clean = stored.filter(
          (value): value is number =>
            Number.isInteger(value) && value >= 1 && value <= LEVELS.length,
        );
        setCompleted(clean);
        const firstOpen = LEVELS.findIndex(
          (candidate) => !clean.includes(candidate.id),
        );
        if (firstOpen > 0) {
          setLevelIndex(firstOpen);
          setAllocation(makeEmptyAllocation(firstOpen));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function resetExperiment(nextLevelIndex = levelIndex) {
    setAllocation(makeEmptyAllocation(nextLevelIndex));
    setStatus("setup");
    setActiveMachine(-1);
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog("等待配置");
  }

  function selectLevel(nextLevelIndex: number) {
    const nextId = LEVELS[nextLevelIndex].id;
    if (nextId > highestUnlocked && !completed.includes(nextId)) return;
    setLevelIndex(nextLevelIndex);
    resetExperiment(nextLevelIndex);
  }

  function changeLevel(machineIndex: number, amount: number) {
    if (status !== "setup") return;
    setAllocation((current) => {
      const next = [...current];
      const target = next[machineIndex] + amount;
      const machineMax = level.machines[machineIndex].rates.length - 1;
      if (target < 0 || target > machineMax) return current;
      if (amount > 0 && remaining <= 0) return current;
      next[machineIndex] = target;
      return next;
    });
  }

  async function runExperiment() {
    if (remaining !== 0 || status !== "setup") return;
    setStatus("running");
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog(`輸入 ${STARTING_ENERGY.toFixed(1)} 單位${level.energyName}`);
    let currentEnergy = STARTING_ENERGY;
    const stepDelay = Math.max(160, 300 - level.machines.length * 14);

    for (let round = 1; round <= level.cycles; round += 1) {
      for (let index = 0; index < level.machines.length; index += 1) {
        const machine = level.machines[index];
        setActiveMachine(index);
        const before = currentEnergy;
        await wait(stepDelay);
        currentEnergy *= machine.rates[allocation[index]];
        setEnergy(currentEnergy);
        setLog(
          `${machine.name}：${before.toFixed(1)} → ${currentEnergy.toFixed(1)} ${machine.output}`,
        );
        await wait(110);
      }
      setCycle(round);
    }

    setActiveMachine(-1);
    if (loopRate > 1) {
      const nextCompleted = completed.includes(level.id)
        ? completed
        : [...completed, level.id].sort((a, b) => a - b);
      setCompleted(nextCompleted);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCompleted));
      setStatus("success");
      setLog("正回饋成立，閉環開始自行加速");
    } else {
      setStatus("failure");
      setLog("輸出不足，系統逐圈衰退");
    }
  }

  function retry() {
    setStatus("setup");
    setActiveMachine(-1);
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog("配置保留，可以繼續調整");
  }

  function goNext() {
    if (levelIndex >= LEVELS.length - 1) {
      resetExperiment();
      return;
    }
    const nextIndex = levelIndex + 1;
    setLevelIndex(nextIndex);
    resetExperiment(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className={`game-shell theme-${level.theme}`}>
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">
          L/R
        </div>
        <div className="brand-copy">
          <p className="eyebrow">IMPOSSIBLE MOTION LAB</p>
          <h1>左腳踩右腳</h1>
          <span>永動機研究所 · 十項不可能實驗</span>
        </div>
        <div className="completion-counter">
          <strong>{completed.length}</strong>
          <span>/ 10 完成</span>
        </div>
      </header>

      <nav className="level-rail" aria-label="關卡選擇">
        {LEVELS.map((candidate, index) => {
          const isComplete = completed.includes(candidate.id);
          const isUnlocked =
            candidate.id <= highestUnlocked || isComplete || index === levelIndex;
          return (
            <button
              key={candidate.id}
              type="button"
              className={`${index === levelIndex ? "current" : ""} ${isComplete ? "complete" : ""}`}
              disabled={!isUnlocked}
              onClick={() => selectLevel(index)}
              aria-label={`第 ${candidate.id} 關：${candidate.title}${isComplete ? "，已完成" : ""}`}
            >
              <span>{String(candidate.id).padStart(2, "0")}</span>
              <i>{isComplete ? "✓" : candidate.machines[0].icon}</i>
            </button>
          );
        })}
      </nav>

      <section className="briefing">
        <div className="level-number">
          <span>EXPERIMENT</span>
          <strong>{String(level.id).padStart(2, "0")}</strong>
        </div>
        <div className="brief-copy">
          <p className="section-label">{level.worldTag}</p>
          <h2>{level.title}</h2>
          <h3>{level.subtitle}</h3>
          <p>{level.brief}</p>
        </div>
        <div className="objective">
          <span>難度</span>
          <div className="difficulty" aria-label={`難度 ${level.difficulty} / 10`}>
            {Array.from({ length: 10 }).map((_, index) => (
              <i key={index} className={index < level.difficulty ? "on" : ""} />
            ))}
          </div>
          <strong>整圈倍率 &gt; 1.000</strong>
          <small>
            {level.machines.length} 個環節 · {level.budget} 枚{level.partName}
          </small>
        </div>
      </section>

      <section className="workbench">
        <aside className="parts-tray">
          <p className="section-label">可用資源</p>
          <div className="parts-count">
            <strong>{remaining}</strong>
            <span>
              / {level.budget}
              <br />
              {level.partName}
            </span>
          </div>
          <div
            className="parts-grid"
            aria-label={`剩餘 ${remaining} 枚${level.partName}`}
          >
            {Array.from({ length: level.budget }).map((_, index) => (
              <span key={index} className={index < remaining ? "" : "used"}>
                {level.partIcon}
              </span>
            ))}
          </div>
          <div className="hint">
            <span>本關提示</span>
            <p>{level.hint}</p>
          </div>
          <button
            type="button"
            className="reset-button"
            onClick={() => resetExperiment()}
          >
            清空本關配置
          </button>
        </aside>

        <div className="experiment">
          <div className="flow-caption">
            <span>閉環流程</span>
            <b>
              {level.machines.map((machine) => machine.input).join(" → ")} →{" "}
              {level.energyName}
            </b>
          </div>

          <div
            className="machine-grid"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(${level.machines.length > 6 ? 178 : 205}px, 1fr))`,
            }}
          >
            {level.machines.map((machine, index) => {
              const machineLevel = allocation[index];
              const rate = machine.rates[machineLevel];
              const maxLevel = machine.rates.length - 1;
              return (
                <article
                  className={`machine-card ${activeMachine === index ? "active" : ""}`}
                  key={machine.code}
                >
                  <div className="machine-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="machine-heading">
                    <span className="machine-icon" aria-hidden="true">
                      {machine.icon}
                    </span>
                    <div>
                      <small>{machine.code}</small>
                      <h3>{machine.name}</h3>
                    </div>
                  </div>
                  <div className="conversion">
                    <span>{machine.input}</span>
                    <b>× {rate.toFixed(3)}</b>
                    <span>{machine.output}</span>
                  </div>
                  <div className="efficiency">
                    <span>目前轉換</span>
                    <strong>{(rate * 100).toFixed(1)}%</strong>
                  </div>
                  <div
                    className="level-lights"
                    aria-label={`已安裝 ${machineLevel} 枚${level.partName}`}
                  >
                    {Array.from({ length: maxLevel }).map((_, slot) => (
                      <i
                        key={slot}
                        className={slot < machineLevel ? "filled" : ""}
                      />
                    ))}
                  </div>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => changeLevel(index, -1)}
                      disabled={machineLevel === 0 || status !== "setup"}
                      aria-label={`移除${machine.name}的${level.partName}`}
                    >
                      −
                    </button>
                    <strong>
                      LV. {machineLevel}
                      <small> / {maxLevel}</small>
                    </strong>
                    <button
                      type="button"
                      onClick={() => changeLevel(index, 1)}
                      disabled={
                        remaining === 0 ||
                        machineLevel === maxLevel ||
                        status !== "setup"
                      }
                      aria-label={`升級${machine.name}`}
                    >
                      ＋
                    </button>
                  </div>
                  <div className="flow-foot">
                    <span>{machine.output}</span>
                    <b aria-hidden="true">→</b>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={`return-line ${activeMachine === level.machines.length - 1 ? "active" : ""}`}>
            <span>
              ↳ {level.machines[level.machines.length - 1].output}重新送回第一個環節
            </span>
          </div>

          <div className="console">
            <div className="energy-readout">
              <span>目前{level.energyName}</span>
              <strong>{energy.toFixed(1)}</strong>
              <small>UNIT</small>
            </div>
            <div className="console-log">
              <span className="terminal-light" />
              <div>
                <small>
                  循環 {cycle} / {level.cycles}
                </small>
                <p>{log}</p>
              </div>
            </div>
            {status === "setup" && (
              <button
                className="launch-button"
                type="button"
                disabled={remaining !== 0}
                onClick={runExperiment}
              >
                {remaining === 0
                  ? "啟動閉環"
                  : `尚餘 ${remaining} 枚${level.partName}`}
              </button>
            )}
            {status === "running" && (
              <button className="launch-button running" type="button" disabled>
                實驗進行中…
              </button>
            )}
            {status === "failure" && (
              <button
                className="launch-button retry"
                type="button"
                onClick={retry}
              >
                重新調整
              </button>
            )}
            {status === "success" && (
              <button
                className="launch-button success"
                type="button"
                onClick={goNext}
              >
                {levelIndex === LEVELS.length - 1 ? "再次挑戰最終關" : "進入下一關"}
              </button>
            )}
          </div>

          {status === "failure" && (
            <div className="result-panel failure-panel" role="status">
              <span className="result-stamp">閉環中斷</span>
              <div>
                <h3>差一點，但它仍然需要外部供給</h3>
                <p>
                  完整一圈只留下 {(loopRate * 100).toFixed(2)}%。
                  嘗試把一枚{level.partName}從邊際效益較低的環節移走。
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="result-panel success-panel" role="status">
              <span className="result-stamp">
                {level.id === 10 ? "宇宙閉合" : "閉環成立"}
              </span>
              <div>
                <h3>
                  {level.id === 10
                    ? "你讓宇宙成功創造了自己"
                    : `${level.title}開始自行加速`}
                </h3>
                <p>
                  每完成一圈，{level.energyName}成長{" "}
                  {((loopRate - 1) * 100).toFixed(2)}%。
                  {level.id === 10
                    ? "十項不可能實驗全部完成。"
                    : "下一項不可能實驗已經解鎖。"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <span>
          研究所守則 #{String(level.id + 3).padStart(2, "0")}：
          {level.id === 10
            ? "若宇宙開始凝視你，請假裝一切都在計畫中。"
            : "成功的永動機，請勿留在無人看管的房間。"}
        </span>
        <span>進度儲存在目前裝置</span>
      </footer>
    </main>
  );
}

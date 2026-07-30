"use client";

import { useState } from "react";

type GameStatus = "setup" | "running" | "success" | "failure";

const PARTS = 6;
const STARTING_ENERGY = 100;

const machines = [
  {
    name: "加熱線圈",
    code: "A-01",
    icon: "⌁",
    input: "電力",
    output: "熱能",
    rates: [0.45, 1.08, 1.15, 1.2, 1.24, 1.27, 1.29],
  },
  {
    name: "壓力鍋爐",
    code: "B-02",
    icon: "♨",
    input: "熱能",
    output: "蒸汽",
    rates: [0.35, 0.72, 1.05, 1.14, 1.2, 1.24, 1.27],
  },
  {
    name: "回收渦輪",
    code: "C-03",
    icon: "✣",
    input: "蒸汽",
    output: "電力",
    rates: [0.25, 0.48, 0.75, 1.02, 1.1, 1.16, 1.2],
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [levels, setLevels] = useState([0, 0, 0]);
  const [status, setStatus] = useState<GameStatus>("setup");
  const [activeMachine, setActiveMachine] = useState(-1);
  const [energy, setEnergy] = useState(STARTING_ENERGY);
  const [cycle, setCycle] = useState(0);
  const [log, setLog] = useState("等待零件配置");

  const used = levels.reduce((sum, level) => sum + level, 0);
  const remaining = PARTS - used;
  const loopRate = levels.reduce(
    (product, level, index) => product * machines[index].rates[level],
    1,
  );

  function changeLevel(index: number, amount: number) {
    if (status !== "setup") return;
    setLevels((current) => {
      const next = [...current];
      const target = next[index] + amount;
      if (target < 0 || target > PARTS) return current;
      if (amount > 0 && current.reduce((a, b) => a + b, 0) >= PARTS) {
        return current;
      }
      next[index] = target;
      return next;
    });
  }

  async function runExperiment() {
    if (remaining !== 0 || status !== "setup") return;
    setStatus("running");
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog("閉環啟動，輸入 100.0 單位電力");
    let currentEnergy = STARTING_ENERGY;

    for (let round = 1; round <= 3; round += 1) {
      for (let index = 0; index < machines.length; index += 1) {
        setActiveMachine(index);
        const before = currentEnergy;
        await wait(560);
        currentEnergy *= machines[index].rates[levels[index]];
        setEnergy(currentEnergy);
        setLog(
          `${machines[index].name}：${before.toFixed(1)} → ${currentEnergy.toFixed(1)} ${machines[index].output}`,
        );
        await wait(330);
      }
      setCycle(round);
    }

    setActiveMachine(-1);
    if (loopRate > 1) {
      setStatus("success");
      setLog("輸出高於輸入，正回饋閉環成立");
    } else {
      setStatus("failure");
      setLog("能量持續流失，閉環無法自行維持");
    }
  }

  function retry() {
    setStatus("setup");
    setActiveMachine(-1);
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog("配置保留，可以繼續調整");
  }

  function reset() {
    setLevels([0, 0, 0]);
    setStatus("setup");
    setActiveMachine(-1);
    setEnergy(STARTING_ENERGY);
    setCycle(0);
    setLog("等待零件配置");
  }

  return (
    <main className="game-shell">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">L/R</div>
        <div>
          <p className="eyebrow">IMPOSSIBLE MOTION LAB · 永動機研究所</p>
          <h1>左腳踩右腳</h1>
        </div>
        <div className="lab-status">
          <span className="status-dot" />
          研究所運作中
        </div>
      </header>

      <section className="briefing">
        <div>
          <p className="section-label">測試編號 001</p>
          <h2>讓它自己養活自己</h2>
          <p>
            把六個效率零件分配給三台裝置。只要電力跑完一圈後比出發時更多，
            機器就能永遠加速。
          </p>
        </div>
        <div className="objective">
          <span>通關條件</span>
          <strong>回收電力 &gt; 100</strong>
          <small>三次完整循環後進行判定</small>
        </div>
      </section>

      <section className="workbench">
        <aside className="parts-tray">
          <p className="section-label">零件盤</p>
          <div className="parts-count">
            <strong>{remaining}</strong>
            <span>/ {PARTS} 未安裝</span>
          </div>
          <div className="parts-grid" aria-label={`剩餘 ${remaining} 個零件`}>
            {Array.from({ length: PARTS }).map((_, index) => (
              <span key={index} className={index < remaining ? "" : "used"}>
                ✦
              </span>
            ))}
          </div>
          <div className="hint">
            <span>研究員筆記</span>
            <p>三台裝置漏能程度不同。平均分配，不一定是最有效率的做法。</p>
          </div>
        </aside>

        <div className="experiment">
          <div className="flow-caption">
            <span>能量流向</span>
            <b>電力 → 熱能 → 蒸汽 → 電力</b>
          </div>

          <div className="machine-row">
            {machines.map((machine, index) => {
              const rate = machine.rates[levels[index]];
              return (
                <div className="machine-wrap" key={machine.code}>
                  <article
                    className={`machine-card ${activeMachine === index ? "active" : ""}`}
                  >
                    <div className="machine-heading">
                      <span className="machine-icon" aria-hidden="true">{machine.icon}</span>
                      <div>
                        <small>{machine.code}</small>
                        <h3>{machine.name}</h3>
                      </div>
                    </div>
                    <div className="conversion">
                      <span>{machine.input}</span>
                      <b>× {rate.toFixed(2)}</b>
                      <span>{machine.output}</span>
                    </div>
                    <div className="efficiency">
                      <span>轉換效率</span>
                      <strong className={rate >= 1 ? "positive" : "negative"}>
                        {(rate * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="level-lights" aria-label={`已安裝 ${levels[index]} 個零件`}>
                      {Array.from({ length: PARTS }).map((_, slot) => (
                        <i key={slot} className={slot < levels[index] ? "filled" : ""} />
                      ))}
                    </div>
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() => changeLevel(index, -1)}
                        disabled={levels[index] === 0 || status !== "setup"}
                        aria-label={`移除${machine.name}零件`}
                      >
                        −
                      </button>
                      <strong>LV. {levels[index]}</strong>
                      <button
                        type="button"
                        onClick={() => changeLevel(index, 1)}
                        disabled={remaining === 0 || status !== "setup"}
                        aria-label={`升級${machine.name}`}
                      >
                        ＋
                      </button>
                    </div>
                  </article>
                  {index < machines.length - 1 && (
                    <span className={`flow-arrow ${activeMachine === index ? "active" : ""}`}>
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`return-line ${activeMachine === 2 ? "active" : ""}`}>
            <span>↳ 回收電力送回起點</span>
          </div>

          <div className="console">
            <div className="energy-readout">
              <span>目前能量</span>
              <strong>{energy.toFixed(1)}</strong>
              <small>UNIT</small>
            </div>
            <div className="console-log">
              <span className="terminal-light" />
              <div>
                <small>循環 {cycle} / 3</small>
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
                {remaining === 0 ? "啟動閉環" : `尚餘 ${remaining} 個零件`}
              </button>
            )}
            {status === "running" && (
              <button className="launch-button running" type="button" disabled>
                測試進行中…
              </button>
            )}
            {status === "failure" && (
              <button className="launch-button retry" type="button" onClick={retry}>
                重新調整
              </button>
            )}
            {status === "success" && (
              <button className="launch-button success" type="button" onClick={reset}>
                再玩一次
              </button>
            )}
          </div>

          {status === "failure" && (
            <div className="result-panel failure-panel" role="status">
              <span className="result-stamp">測試失敗</span>
              <div>
                <h3>機器熄火了</h3>
                <p>
                  每繞一圈只剩原本的 {(loopRate * 100).toFixed(1)}%。
                  找出最會漏能的裝置，把零件移過去試試。
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="result-panel success-panel" role="status">
              <span className="result-stamp">閉環成立</span>
              <div>
                <h3>它真的開始自己踩自己了！</h3>
                <p>
                  每完成一圈，能量成長 {((loopRate - 1) * 100).toFixed(1)}%。
                  永動機已進入不可逆加速。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <span>研究所守則 #04：成功的永動機，請勿留在室內。</span>
        <button type="button" onClick={reset}>重置實驗</button>
      </footer>
    </main>
  );
}

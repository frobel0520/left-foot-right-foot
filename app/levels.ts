export type ThemeName =
  | "lab"
  | "garden"
  | "neon"
  | "ocean"
  | "arcane"
  | "cyber"
  | "alchemy"
  | "space"
  | "hell"
  | "cosmic";

export type MachineSpec = {
  name: string;
  code: string;
  icon: string;
  input: string;
  output: string;
  rates: number[];
};

export type GameLevel = {
  id: number;
  theme: ThemeName;
  worldTag: string;
  title: string;
  subtitle: string;
  brief: string;
  hint: string;
  partName: string;
  partIcon: string;
  energyName: string;
  cycles: number;
  difficulty: number;
  budget: number;
  solution: number[];
  machines: MachineSpec[];
};

type MachineSeed = Omit<MachineSpec, "rates"> & {
  seed: number;
};

type LevelSeed = Omit<GameLevel, "budget" | "machines" | "solution"> & {
  targets: number[];
  machines: MachineSeed[];
};

function buildRates(
  machine: MachineSeed,
  target: number,
  machineIndex: number,
) {
  const rawBase = 0.36 + ((machine.seed * 17) % 9) * 0.018;
  const gains = Array.from({ length: target + 2 }, (_, stepIndex) => {
    if (stepIndex < target) {
      return (
        1.69 -
        stepIndex * 0.055 +
        ((machine.seed * 13) % 7) * 0.009 -
        machineIndex * 0.002
      );
    }
    return stepIndex === target
      ? 1.075 + (machine.seed % 3) * 0.005
      : 1.035 + (machine.seed % 2) * 0.005;
  });

  const rates = [rawBase];
  gains.forEach((gain) => {
    rates.push(rates[rates.length - 1] * gain);
  });
  return rates;
}

function createLevel(seed: LevelSeed): GameLevel {
  const rawRates = seed.machines.map((machine, index) =>
    buildRates(machine, seed.targets[index], index),
  );
  const rawSolutionRate = rawRates.reduce(
    (product, rates, index) => product * rates[seed.targets[index]],
    1,
  );
  const desiredRate = 1.055 + seed.id * 0.009;
  const scale = Math.pow(
    desiredRate / rawSolutionRate,
    1 / seed.machines.length,
  );

  return {
    ...seed,
    budget: seed.targets.reduce((sum, target) => sum + target, 0),
    solution: seed.targets,
    machines: seed.machines.map((machine, index) => ({
      name: machine.name,
      code: machine.code,
      icon: machine.icon,
      input: machine.input,
      output: machine.output,
      rates: rawRates[index].map((rate) => rate * scale),
    })),
  };
}

const levelSeeds: LevelSeed[] = [
  {
    id: 1,
    theme: "lab",
    worldTag: "IML / BOILER TEST",
    title: "失控鍋爐房",
    subtitle: "讓第一台不可能機器醒來",
    brief:
      "老式鍋爐只差一點就能自行運轉。把四枚黃銅螺帽裝到三台設備上，讓回收電力超過最初輸入。",
    hint: "先比較每次升級前後，倍率增加了多少。",
    partName: "黃銅螺帽",
    partIcon: "◆",
    energyName: "電力",
    cycles: 2,
    difficulty: 1,
    targets: [1, 2, 1],
    machines: [
      {
        name: "電弧線圈",
        code: "A-01",
        icon: "ϟ",
        input: "電力",
        output: "熱能",
        seed: 2,
      },
      {
        name: "黃銅鍋爐",
        code: "B-02",
        icon: "♨",
        input: "熱能",
        output: "蒸汽",
        seed: 5,
      },
      {
        name: "回收渦輪",
        code: "C-03",
        icon: "✣",
        input: "蒸汽",
        output: "電力",
        seed: 8,
      },
    ],
  },
  {
    id: 2,
    theme: "garden",
    worldTag: "SELF-WATERING HABITAT",
    title: "會下雨的溫室",
    subtitle: "一滴水養出下一場雨",
    brief:
      "根系吸水、葉片蒸散、苔蘚集霧。七滴催化露珠必須被分到最需要的地方，才能封閉這座微型氣候。",
    hint: "別要求每一段都超過 100%；真正重要的是完整一圈。",
    partName: "催化露珠",
    partIcon: "●",
    energyName: "水分",
    cycles: 2,
    difficulty: 2,
    targets: [2, 3, 2],
    machines: [
      {
        name: "毛細根網",
        code: "ROOT",
        icon: "♧",
        input: "水分",
        output: "葉片",
        seed: 3,
      },
      {
        name: "蒸散樹冠",
        code: "LEAF",
        icon: "❧",
        input: "葉片",
        output: "雲氣",
        seed: 7,
      },
      {
        name: "集霧苔蘚",
        code: "MOSS",
        icon: "◌",
        input: "雲氣",
        output: "水分",
        seed: 11,
      },
    ],
  },
  {
    id: 3,
    theme: "neon",
    worldTag: "NIGHT MARKET LOOP",
    title: "永不打烊夜市",
    subtitle: "香味會帶來人潮，人潮會帶來現金",
    brief:
      "八枚金色籌碼要在採買、烹調、招客和收銀之間流動。夜市若能在天亮前賺回更多現金，就能永遠營業。",
    hint: "裝置增加到四個；最亮眼的設備不一定值得繼續投資。",
    partName: "金色籌碼",
    partIcon: "¥",
    energyName: "現金",
    cycles: 2,
    difficulty: 3,
    targets: [1, 3, 2, 2],
    machines: [
      {
        name: "凌晨採買員",
        code: "BUY",
        icon: "囍",
        input: "現金",
        output: "食材",
        seed: 4,
      },
      {
        name: "百年鐵板爐",
        code: "WOK",
        icon: "火",
        input: "食材",
        output: "香氣",
        seed: 9,
      },
      {
        name: "霓虹招牌",
        code: "NEON",
        icon: "光",
        input: "香氣",
        output: "人潮",
        seed: 12,
      },
      {
        name: "無情收銀台",
        code: "CASH",
        icon: "$",
        input: "人潮",
        output: "現金",
        seed: 15,
      },
    ],
  },
  {
    id: 4,
    theme: "ocean",
    worldTag: "ABYSSAL CYCLE 04",
    title: "深海循環站",
    subtitle: "海面以下八千公尺，沒有補給船",
    brief:
      "電解氧氣維持探勘，探勘找到熱泉，熱泉再產生電力。十枚耐壓封環決定基地會繁榮，還是永遠沉默。",
    hint: "有些設備要連續升級數次，才會跨過真正的性能突破點。",
    partName: "耐壓封環",
    partIcon: "◉",
    energyName: "電力",
    cycles: 2,
    difficulty: 4,
    targets: [3, 1, 4, 2],
    machines: [
      {
        name: "鹽水電解槽",
        code: "O₂",
        icon: "≈",
        input: "電力",
        output: "氧氣",
        seed: 5,
      },
      {
        name: "鈦合金潛水鐘",
        code: "DIVE",
        icon: "⌄",
        input: "氧氣",
        output: "探勘",
        seed: 10,
      },
      {
        name: "海床鑽探臂",
        code: "DRILL",
        icon: "⚒",
        input: "探勘",
        output: "熱泉",
        seed: 14,
      },
      {
        name: "熱差發電機",
        code: "THERM",
        icon: "∆",
        input: "熱泉",
        output: "電力",
        seed: 18,
      },
    ],
  },
  {
    id: 5,
    theme: "arcane",
    worldTag: "CIRCLE OF FIVE",
    title: "午夜召喚陣",
    subtitle: "五個儀式，一個不能直呼其名的結果",
    brief:
      "魔力寫成符文，符文喚來低語，低語締結誓約，誓約凝成水晶，水晶重新釋放魔力。",
    hint: "十一枚符印、五個環節。先找每個環節的甜蜜點，再考慮整體。",
    partName: "月蝕符印",
    partIcon: "✦",
    energyName: "魔力",
    cycles: 2,
    difficulty: 5,
    targets: [2, 3, 1, 3, 2],
    machines: [
      {
        name: "自書羽毛",
        code: "QUILL",
        icon: "ψ",
        input: "魔力",
        output: "符文",
        seed: 6,
      },
      {
        name: "無面魔鏡",
        code: "MIRROR",
        icon: "◇",
        input: "符文",
        output: "低語",
        seed: 11,
      },
      {
        name: "銀舌風鈴",
        code: "BELL",
        icon: "♢",
        input: "低語",
        output: "誓約",
        seed: 16,
      },
      {
        name: "血契印臺",
        code: "PACT",
        icon: "✧",
        input: "誓約",
        output: "水晶",
        seed: 20,
      },
      {
        name: "月相祭壇",
        code: "MOON",
        icon: "☾",
        input: "水晶",
        output: "魔力",
        seed: 24,
      },
    ],
  },
  {
    id: 6,
    theme: "cyber",
    worldTag: "GROWTH STACK v6.0",
    title: "病毒式社群",
    subtitle: "每一位使用者，都負責帶來下一位",
    brief:
      "內容創造互動，互動餵養推薦，推薦換取曝光，曝光再拉來使用者。十四枚頻寬晶片要讓平台突破臨界質量。",
    hint: "注意邊際效益。已經很強的節點，下一級可能只是一點點改善。",
    partName: "頻寬晶片",
    partIcon: "▣",
    energyName: "使用者",
    cycles: 2,
    difficulty: 6,
    targets: [4, 2, 3, 1, 4],
    machines: [
      {
        name: "創作者工具",
        code: "CREATE",
        icon: "01",
        input: "使用者",
        output: "貼文",
        seed: 7,
      },
      {
        name: "即時推播",
        code: "PUSH",
        icon: ">>",
        input: "貼文",
        output: "互動",
        seed: 12,
      },
      {
        name: "推薦演算法",
        code: "ALGO",
        icon: "λ",
        input: "互動",
        output: "推薦",
        seed: 17,
      },
      {
        name: "全站熱門榜",
        code: "TREND",
        icon: "#",
        input: "推薦",
        output: "曝光",
        seed: 22,
      },
      {
        name: "無限邀請碼",
        code: "INVITE",
        icon: "+1",
        input: "曝光",
        output: "使用者",
        seed: 27,
      },
    ],
  },
  {
    id: 7,
    theme: "alchemy",
    worldTag: "OPUS MAGNUM VII",
    title: "王家煉金爐",
    subtitle: "把鉛變成黃金，再用黃金挖出更多鉛",
    brief:
      "六段大工藝互相供養。十五簇秘火若分配正確，王國的財富就能脫離物質守恆。",
    hint: "裝置越多，憑直覺平均分配越危險。記錄每次調整造成的整圈變化。",
    partName: "秘火",
    partIcon: "▲",
    energyName: "鉛礦",
    cycles: 2,
    difficulty: 7,
    targets: [2, 4, 1, 3, 2, 4],
    machines: [
      {
        name: "黑鉛蒸餾瓶",
        code: "NIGREDO",
        icon: "♜",
        input: "鉛礦",
        output: "水銀",
        seed: 8,
      },
      {
        name: "白鹽結晶皿",
        code: "ALBEDO",
        icon: "♙",
        input: "水銀",
        output: "白鹽",
        seed: 13,
      },
      {
        name: "赤紅密室",
        code: "RUBEDO",
        icon: "☉",
        input: "白鹽",
        output: "賢者石",
        seed: 19,
      },
      {
        name: "物質轉化爐",
        code: "AURUM",
        icon: "Au",
        input: "賢者石",
        output: "黃金",
        seed: 25,
      },
      {
        name: "王家國庫",
        code: "CROWN",
        icon: "♛",
        input: "黃金",
        output: "遠征",
        seed: 30,
      },
      {
        name: "北境礦山",
        code: "MINE",
        icon: "⚒",
        input: "遠征",
        output: "鉛礦",
        seed: 35,
      },
    ],
  },
  {
    id: 8,
    theme: "space",
    worldTag: "LUNAR HABITAT ∞",
    title: "環月殖民環",
    subtitle: "離地球三十八萬公里的自給自足",
    brief:
      "十九組軌道模組，六個維生環節。任何一點浪費都會在真空中被無限放大。",
    hint: "高等級不代表高效率；比較『這一級』帶來的提升，而不是總倍率。",
    partName: "軌道模組",
    partIcon: "⬡",
    energyName: "陽光",
    cycles: 2,
    difficulty: 8,
    targets: [4, 2, 5, 3, 1, 4],
    machines: [
      {
        name: "追日帆板",
        code: "SOL",
        icon: "☼",
        input: "陽光",
        output: "電力",
        seed: 9,
      },
      {
        name: "月冰電解器",
        code: "L-ICE",
        icon: "◈",
        input: "電力",
        output: "氧氣",
        seed: 14,
      },
      {
        name: "低重力農艙",
        code: "FARM",
        icon: "♧",
        input: "氧氣",
        output: "船員",
        seed: 21,
      },
      {
        name: "深空研究室",
        code: "LAB",
        icon: "⌬",
        input: "船員",
        output: "藍圖",
        seed: 28,
      },
      {
        name: "氦三採集機",
        code: "HE-3",
        icon: "③",
        input: "藍圖",
        output: "核燃料",
        seed: 34,
      },
      {
        name: "聚變人造日",
        code: "FUSION",
        icon: "✺",
        input: "核燃料",
        output: "陽光",
        seed: 40,
      },
    ],
  },
  {
    id: 9,
    theme: "hell",
    worldTag: "INFERNAL KPI OFFICE",
    title: "地獄績效部",
    subtitle: "表格製造罪名，罪名製造更多亡魂",
    brief:
      "二十二枚核准印章、七個永遠加班的部門。請讓行政流程在沒有活人的情況下繼續擴張。",
    hint: "這是一場配置搜尋。先排除明顯過度投資，再處理最接近成功的方案。",
    partName: "核准印章",
    partIcon: "印",
    energyName: "亡魂",
    cycles: 2,
    difficulty: 9,
    targets: [2, 5, 3, 1, 4, 2, 5],
    machines: [
      {
        name: "亡者櫃檯",
        code: "RECV",
        icon: "冥",
        input: "亡魂",
        output: "表格",
        seed: 10,
      },
      {
        name: "千手簽核處",
        code: "SIGN",
        icon: "簽",
        input: "表格",
        output: "核准",
        seed: 15,
      },
      {
        name: "痛苦量化室",
        code: "KPI",
        icon: "%",
        input: "核准",
        output: "績效",
        seed: 22,
      },
      {
        name: "無人升遷梯",
        code: "PROMO",
        icon: "↑",
        input: "績效",
        output: "升遷",
        seed: 29,
      },
      {
        name: "規章增生科",
        code: "RULE",
        icon: "§",
        input: "升遷",
        output: "規章",
        seed: 36,
      },
      {
        name: "罪名發明局",
        code: "GUILT",
        icon: "罪",
        input: "規章",
        output: "罪名",
        seed: 43,
      },
      {
        name: "輪迴執行處",
        code: "LOOP",
        icon: "∞",
        input: "罪名",
        output: "亡魂",
        seed: 50,
      },
    ],
  },
  {
    id: 10,
    theme: "cosmic",
    worldTag: "BOOTSTRAP REALITY / FINAL",
    title: "宇宙自舉",
    subtitle: "是誰創造了創造者？",
    brief:
      "二十八個悖論、八層存在。讓念頭創造語言，語言創造機器，最後由宇宙中的觀測者重新產生第一個念頭。",
    hint: "最後沒有捷徑。找出每個環節最後一次『值得的升級』，再讓整個宇宙閉合。",
    partName: "悖論",
    partIcon: "∞",
    energyName: "念頭",
    cycles: 2,
    difficulty: 10,
    targets: [5, 2, 4, 1, 6, 3, 2, 5],
    machines: [
      {
        name: "第一個念頭",
        code: "COGITO",
        icon: "?",
        input: "念頭",
        output: "語言",
        seed: 11,
      },
      {
        name: "自述語法",
        code: "LOGOS",
        icon: "Aa",
        input: "語言",
        output: "機器",
        seed: 16,
      },
      {
        name: "造物機",
        code: "FABER",
        icon: "⚙",
        input: "機器",
        output: "能量",
        seed: 23,
      },
      {
        name: "零點火花",
        code: "SPARK",
        icon: "✦",
        input: "能量",
        output: "時間",
        seed: 31,
      },
      {
        name: "時間膨脹器",
        code: "AEON",
        icon: "⌛",
        input: "時間",
        output: "宇宙",
        seed: 39,
      },
      {
        name: "可見宇宙",
        code: "COSMOS",
        icon: "◎",
        input: "宇宙",
        output: "觀測者",
        seed: 47,
      },
      {
        name: "最後觀測者",
        code: "EYE",
        icon: "◉",
        input: "觀測者",
        output: "疑問",
        seed: 55,
      },
      {
        name: "未解之問",
        code: "WHY",
        icon: "¿",
        input: "疑問",
        output: "念頭",
        seed: 63,
      },
    ],
  },
];

export const LEVELS = levelSeeds.map(createLevel);

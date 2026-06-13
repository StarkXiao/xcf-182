export const LEVELS = [
  {
    id: 1,
    name: '微光初现',
    description: '点亮沿途的荧光植物，为小生物指引方向',
    gridSize: { rows: 5, cols: 5 },
    start: { row: 0, col: 0 },
    end: { row: 4, col: 4 },
    obstacles: [
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 1 }
    ],
    plants: [
      { row: 0, col: 1, type: 'moss' },
      { row: 0, col: 2, type: 'mushroom' },
      { row: 1, col: 2, type: 'moss' },
      { row: 1, col: 3, type: 'flower' },
      { row: 2, col: 3, type: 'mushroom' },
      { row: 3, col: 3, type: 'moss' },
      { row: 3, col: 4, type: 'flower' },
      { row: 2, col: 0, type: 'mushroom' },
      { row: 3, col: 0, type: 'moss' },
      { row: 4, col: 0, type: 'flower' },
      { row: 4, col: 1, type: 'moss' },
      { row: 4, col: 2, type: 'mushroom' }
    ],
    correctPath: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 4 }
    ],
    hint: '沿着右上方的路径前进，避开中间的障碍物'
  },
  {
    id: 2,
    name: '蜿蜒小径',
    description: '路径更加曲折，仔细规划你的路线',
    gridSize: { rows: 6, cols: 6 },
    start: { row: 0, col: 0 },
    end: { row: 5, col: 5 },
    obstacles: [
      { row: 0, col: 3 },
      { row: 1, col: 1 },
      { row: 1, col: 4 },
      { row: 2, col: 2 },
      { row: 3, col: 0 },
      { row: 3, col: 3 },
      { row: 4, col: 1 },
      { row: 4, col: 4 }
    ],
    plants: [
      { row: 0, col: 1, type: 'moss' },
      { row: 0, col: 2, type: 'mushroom' },
      { row: 1, col: 2, type: 'flower' },
      { row: 1, col: 3, type: 'moss' },
      { row: 2, col: 3, type: 'mushroom' },
      { row: 2, col: 4, type: 'flower' },
      { row: 2, col: 5, type: 'moss' },
      { row: 3, col: 5, type: 'mushroom' },
      { row: 4, col: 5, type: 'flower' },
      { row: 5, col: 5, type: 'moss' },
      { row: 5, col: 4, type: 'mushroom' },
      { row: 5, col: 3, type: 'flower' },
      { row: 4, col: 3, type: 'moss' },
      { row: 4, col: 2, type: 'mushroom' },
      { row: 5, col: 2, type: 'flower' },
      { row: 5, col: 1, type: 'moss' },
      { row: 5, col: 0, type: 'mushroom' }
    ],
    correctPath: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
      { row: 3, col: 5 },
      { row: 4, col: 5 },
      { row: 5, col: 5 }
    ],
    hint: '先向右，再向下，沿着边缘绕过障碍物'
  },
  {
    id: 3,
    name: '迷宫深处',
    description: '洞穴深处的复杂迷宫，需要智慧才能通过',
    gridSize: { rows: 7, cols: 7 },
    start: { row: 0, col: 3 },
    end: { row: 6, col: 3 },
    obstacles: [
      { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 4 }, { row: 1, col: 5 },
      { row: 2, col: 1 }, { row: 2, col: 5 },
      { row: 3, col: 1 }, { row: 3, col: 3 }, { row: 3, col: 5 },
      { row: 4, col: 1 }, { row: 4, col: 5 },
      { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 4 }, { row: 5, col: 5 }
    ],
    plants: [
      { row: 0, col: 2, type: 'moss' },
      { row: 0, col: 4, type: 'mushroom' },
      { row: 1, col: 3, type: 'flower' },
      { row: 2, col: 2, type: 'moss' },
      { row: 2, col: 3, type: 'mushroom' },
      { row: 2, col: 4, type: 'flower' },
      { row: 3, col: 2, type: 'moss' },
      { row: 3, col: 4, type: 'mushroom' },
      { row: 4, col: 2, type: 'flower' },
      { row: 4, col: 3, type: 'moss' },
      { row: 4, col: 4, type: 'mushroom' },
      { row: 5, col: 3, type: 'flower' },
      { row: 6, col: 2, type: 'moss' },
      { row: 6, col: 4, type: 'mushroom' },
      { row: 0, col: 0, type: 'flower' },
      { row: 0, col: 6, type: 'moss' },
      { row: 6, col: 0, type: 'mushroom' },
      { row: 6, col: 6, type: 'flower' }
    ],
    correctPath: [
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 3, col: 4 },
      { row: 2, col: 4 },
      { row: 2, col: 3 },
      { row: 4, col: 3 },
      { row: 5, col: 3 },
      { row: 6, col: 3 }
    ],
    hint: '先向下，然后左右探索，找到通往终点的路'
  }
]

export const PLANT_TYPES = {
  moss: {
    name: '苔藓',
    color: 0x4ade80,
    glowColor: 0x22c55e,
    size: 30,
    points: 10
  },
  mushroom: {
    name: '荧光蘑菇',
    color: 0xf472b6,
    glowColor: 0xec4899,
    size: 35,
    points: 20
  },
  flower: {
    name: '夜光花',
    color: 0x60a5fa,
    glowColor: 0x3b82f6,
    size: 40,
    points: 30
  }
}

export const NPCS = {
  elder: {
    id: 'elder',
    name: '苔藓长老',
    emoji: '🧙',
    color: '#22c55e',
    description: '洞穴中最古老的存在，知晓一切秘密'
  },
  luna: {
    id: 'luna',
    name: '月光萤',
    emoji: '🦋',
    color: '#60a5fa',
    description: '来自地表的小精灵，迷路后定居洞穴'
  },
  rocky: {
    id: 'rocky',
    name: '小石灵',
    emoji: '🗿',
    color: '#a78bfa',
    description: '沉默寡言的岩石精灵，守护着水晶矿脉'
  },
  bloom: {
    id: 'bloom',
    name: '花之灵',
    emoji: '🌸',
    color: '#f472b6',
    description: '洞穴深处花朵的化身，温柔而神秘'
  },
  player: {
    id: 'player',
    name: '引路人',
    emoji: '🧝',
    color: '#fbbf24',
    description: '你，拥有点亮荧光植物的能力'
  }
}

export const LORE = {
  caveOrigin: {
    title: '星辰洞穴的起源',
    content: '千年前，一颗流星坠落此地，撞开了通往地底的大门。流星的碎片化为了发光的水晶，滋养了这片地下世界。'
  },
  ecosystem: {
    title: '洞穴生态',
    content: '苔藓是最基础的生命，吸收着大地微弱的能量；荧光蘑菇在黑暗中绽放光芒；夜光花则是最珍稀的存在，只在生命之源附近才能生长。'
  },
  creatures: {
    title: '洞穴生物',
    content: '小荧光兽以发光植物为食，它们的皮毛会折射出美丽的光芒。它们天性胆小，需要被引导才能安全回家。'
  },
  lifeSource: {
    title: '生命之源',
    content: '传说中位于洞穴最深处的神秘泉水，是所有洞穴生命的起源。据说它能让枯萎的植物重新焕发生机。'
  }
}

export const STORY_DIALOGUES = {
  prologue: [
    {
      speaker: 'elder',
      text: '年轻的引路人啊，你终于来了。'
    },
    {
      speaker: 'player',
      text: '长老，我感应到洞穴中的光芒正在减弱……'
    },
    {
      speaker: 'elder',
      text: '是的，生命之源正在沉睡。洞穴里的小生物们都迷路了，它们需要你的帮助。'
    },
    {
      speaker: 'elder',
      text: '你拥有点亮荧光植物的能力。请沿着路径前进，为它们照亮回家的路。'
    },
    {
      speaker: 'player',
      text: '我明白了，长老。我这就出发。'
    },
    {
      speaker: 'elder',
      text: '去吧，愿苔藓的祝福与你同行。这是第一关——「微光初现」。'
    }
  ],
  level1After: [
    {
      speaker: 'luna',
      text: '哇！你真的点亮了那些植物！好厉害！'
    },
    {
      speaker: 'player',
      text: '你是……？'
    },
    {
      speaker: 'luna',
      text: '我叫月光萤，是从地表来的蝴蝶精灵。我在洞里迷路了好久……'
    },
    {
      speaker: 'luna',
      text: '那些荧光植物是洞穴生物的路标哦，没有它们，大家都会迷路的！'
    },
    {
      speaker: 'player',
      text: '原来如此。我会继续点亮更多的。'
    },
    {
      speaker: 'luna',
      text: '嗯嗯！我带你去下一个区域——「蜿蜒小径」，那里有更多需要帮助的小伙伴！'
    }
  ],
  level2After: [
    {
      speaker: 'rocky',
      text: '……'
    },
    {
      speaker: 'luna',
      text: '呀，小石灵！你怎么一个人在这里？'
    },
    {
      speaker: 'rocky',
      text: '……水晶，暗了。'
    },
    {
      speaker: 'player',
      text: '水晶？你是说那些发光的矿石吗？'
    },
    {
      speaker: 'rocky',
      text: '嗯。我的家，「水晶回廊」。需要，光。'
    },
    {
      speaker: 'player',
      text: '交给我吧，我会帮你的。'
    },
    {
      speaker: 'rocky',
      text: '……谢谢。'
    }
  ],
  level3After: [
    {
      speaker: 'elder',
      text: '做得好，引路人。你已经深入洞穴了。'
    },
    {
      speaker: 'player',
      text: '长老，我发现越往深处，植物越难点亮……'
    },
    {
      speaker: 'elder',
      text: '那是因为生命之源的影响正在减弱。不过，你也在逐渐唤醒它。'
    },
    {
      speaker: 'elder',
      text: '前方是「迷宫深处」，那里住着一只古老的荧光兽，它已经很久没能回家了。'
    },
    {
      speaker: 'player',
      text: '我一定会找到它的！'
    }
  ],
  level4After: [
    {
      speaker: 'bloom',
      text: '……是你，带来了光。'
    },
    {
      speaker: 'player',
      text: '你是谁？你的声音好温柔……'
    },
    {
      speaker: 'bloom',
      text: '我是花之灵，来自「深渊边缘」的夜光花丛。'
    },
    {
      speaker: 'bloom',
      text: '我已经很久很久……没有见过这么多光了。'
    },
    {
      speaker: 'player',
      text: '我会让整个洞穴都重新亮起来的。'
    },
    {
      speaker: 'bloom',
      text: '谢谢你……请继续前行，古树的根系守护着更深处的秘密。'
    }
  ],
  level5After: [
    {
      speaker: 'luna',
      text: '你看你看！这些根须好壮观！'
    },
    {
      speaker: 'rocky',
      text: '古树。母亲。所有生命，源头。'
    },
    {
      speaker: 'player',
      text: '这棵古树……是从地表一直长到这里的吗？'
    },
    {
      speaker: 'elder',
      text: '正是。千年前的流星带来了种子，它在黑暗中扎根，成为了洞穴生命的支柱。'
    },
    {
      speaker: 'elder',
      text: '穿过「古树根系」，你就接近洞穴的核心了。'
    },
    {
      speaker: 'player',
      text: '我感觉到了……前方有温暖的光芒。'
    }
  ],
  level6After: [
    {
      speaker: 'bloom',
      text: '你终于到了萤火湖泊……'
    },
    {
      speaker: 'player',
      text: '好美……水面上全是萤火虫！'
    },
    {
      speaker: 'bloom',
      text: '它们是夜光花的守护者。湖泊中央，就是生命之源的入口。'
    },
    {
      speaker: 'bloom',
      text: '但是要小心，湖中隐藏着漩涡，一步踏错就会被卷入深处……'
    },
    {
      speaker: 'player',
      text: '我明白。我会小心通过的。'
    }
  ],
  level7After: [
    {
      speaker: 'rocky',
      text: '晶簇密林。我的，出生地。'
    },
    {
      speaker: 'luna',
      text: '这些水晶好漂亮！就像一片发光的森林！'
    },
    {
      speaker: 'rocky',
      text: '很久以前，很亮。现在，暗淡了。'
    },
    {
      speaker: 'player',
      text: '等我唤醒生命之源，它们一定会重新闪耀的。'
    },
    {
      speaker: 'rocky',
      text: '……嗯。我信你。'
    },
    {
      speaker: 'elder',
      text: '继续前行吧，引路人。远古圣殿就在前方。'
    }
  ],
  level8After: [
    {
      speaker: 'elder',
      text: '这是「远古圣殿」，千年前守护生命之源的先人们建造的。'
    },
    {
      speaker: 'player',
      text: '这些机关和符文……好古老。'
    },
    {
      speaker: 'elder',
      text: '它们是为了保护生命之源不被恶人夺取而设的。但现在，它们也阻挡了我们。'
    },
    {
      speaker: 'luna',
      text: '引路人一定能解开这些机关的！对吧？'
    },
    {
      speaker: 'player',
      text: '我会尽力的。圣殿之后……就是生命之源了吧？'
    },
    {
      speaker: 'bloom',
      text: '是的……我能感觉到它的心跳，就在不远处。'
    }
  ],
  level9After: [
    {
      speaker: 'elder',
      text: '终于……你来到了最后一道关卡。'
    },
    {
      speaker: 'player',
      text: '这就是「生命之源」吗？我能感受到强大的生命力！'
    },
    {
      speaker: 'bloom',
      text: '它在沉睡……但因为你一路点亮的植物，它已经有了苏醒的迹象。'
    },
    {
      speaker: 'rocky',
      text: '最后的路。我们，陪你。'
    },
    {
      speaker: 'luna',
      text: '对！我们大家一起！引路人，加油！'
    },
    {
      speaker: 'player',
      text: '谢谢你们……我不是一个人在战斗。走吧，一起唤醒生命之源！'
    }
  ],
  epilogue: [
    {
      speaker: 'elder',
      text: '生命之源……它苏醒了！'
    },
    {
      speaker: 'luna',
      text: '哇！整个洞穴都亮起来了！好漂亮！'
    },
    {
      speaker: 'rocky',
      text: '水晶，亮了。家，亮了。'
    },
    {
      speaker: 'bloom',
      text: '花朵们都在盛开……这是千年未见的景象。'
    },
    {
      speaker: 'elder',
      text: '引路人，你做到了。整个洞穴生态都因你而重获新生。'
    },
    {
      speaker: 'player',
      text: '不，是我们一起做到的。谢谢你们的陪伴。'
    },
    {
      speaker: 'elder',
      text: '从今天起，你就是星辰洞穴的守护者。愿光，永远与你同在。'
    },
    {
      speaker: 'luna',
      text: '以后我们就是朋友啦！要常来看我们哦！'
    },
    {
      speaker: 'bloom',
      text: '夜光花，会永远为你绽放。'
    },
    {
      speaker: 'rocky',
      text: '……欢迎回家。'
    }
  ]
}

export const getDialogueForLevel = (levelIndex, isBefore) => {
  if (levelIndex === 0 && isBefore) {
    return STORY_DIALOGUES.prologue
  }
  if (!isBefore) {
    const dialogueKey = `level${levelIndex + 1}After`
    if (STORY_DIALOGUES[dialogueKey]) {
      return STORY_DIALOGUES[dialogueKey]
    }
  }
  if (levelIndex >= 9 && !isBefore) {
    return STORY_DIALOGUES.epilogue
  }
  return null
}

export const NPCS = {
  elder: {
    id: 'elder',
    name: '苔藓长老',
    emoji: '🧙',
    color: '#22c55e',
    description: '洞穴中最古老的存在，是第一株获得灵智的苔藓。它已经在洞穴中生活了九百多年，见证了洞穴生态的变迁。'
  },
  luna: {
    id: 'luna',
    name: '月光萤',
    emoji: '🦋',
    color: '#60a5fa',
    description: '本是地表的蝴蝶精灵，三年前追逐一颗流星的光芒误入洞穴。她翅膀上的鳞粉能反射微光，是洞穴生物们喜爱的伙伴。'
  },
  rocky: {
    id: 'rocky',
    name: '小石灵',
    emoji: '🗿',
    color: '#a78bfa',
    description: '水晶矿脉的守护者，由流星碎片的能量孕育而生。它们沉默寡言，世代守护着洞穴中的水晶森林。'
  },
  bloom: {
    id: 'bloom',
    name: '花之灵',
    emoji: '🌸',
    color: '#f472b6',
    description: '夜光花的化身，诞生于生命之源最旺盛的年代。她沉睡了很久，直到引路人的到来才逐渐苏醒。'
  },
  player: {
    id: 'player',
    name: '引路人',
    emoji: '🧝',
    color: '#fbbf24',
    description: '你——拥有点亮荧光植物的特殊能力，是传说中的「引路人」。你的血脉中流淌着远古守护者的力量。'
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
  level1Before: [
    {
      speaker: 'elder',
      text: '年轻的引路人啊，你终于来了。'
    },
    {
      speaker: 'player',
      text: '长老，我感应到洞穴中的光芒正在减弱……这里究竟是什么地方？'
    },
    {
      speaker: 'elder',
      text: '这里是星辰洞穴——千年前，一颗流星坠落此地，撞开了通往地底的大门。'
    },
    {
      speaker: 'elder',
      text: '我是苔藓长老，是这洞穴中第一株获得灵智的苔藓。算下来，我已经活了九百多岁了。'
    },
    {
      speaker: 'player',
      text: '九百多岁……真是难以想象。那我能做些什么呢？'
    },
    {
      speaker: 'elder',
      text: '你拥有点亮荧光植物的能力。生命之源正在沉睡，洞穴里的小生物们都迷路了。'
    },
    {
      speaker: 'elder',
      text: '去吧，从起点到终点，沿途点亮植物。那些小荧光兽会沿着光找到回家的路。'
    },
    {
      speaker: 'player',
      text: '我明白了，长老。这第一关——「微光初现」，我会好好完成的。'
    }
  ],
  level1After: [
    {
      speaker: 'luna',
      text: '哇！你真的点亮了那些植物！好厉害！'
    },
    {
      speaker: 'player',
      text: '你是……一只发光的蝴蝶？'
    },
    {
      speaker: 'luna',
      text: '我叫月光萤，本来是地表的蝴蝶精灵。三年前我追逐一颗流星的光芒，不小心飞进了洞穴。'
    },
    {
      speaker: 'luna',
      text: '我的翅膀能反射微光，洞穴里的小伙伴们都很喜欢我！'
    },
    {
      speaker: 'player',
      text: '原来如此。那你知道为什么这些植物能发光吗？'
    },
    {
      speaker: 'luna',
      text: '这是洞穴的生态链哦！最基础的是苔藓，它们吸收大地微弱的能量就能生长。'
    },
    {
      speaker: 'luna',
      text: '然后是荧光蘑菇，它们靠分解苔藓的养分发光。最珍贵的是夜光花，只在特殊的地方才有。'
    },
    {
      speaker: 'elder',
      text: '说得不错，月光萤。引路人，这只是开始。更深处还有更多需要帮助的小生命。'
    },
    {
      speaker: 'luna',
      text: '我带你去下一个区域吧——「蜿蜒小径」，那里有更多迷路的小伙伴！'
    }
  ],
  level2Before: [
    {
      speaker: 'luna',
      text: '你看，这就是蜿蜒小径。洞穴里的路都是这样曲曲折折的。'
    },
    {
      speaker: 'player',
      text: '这些路是怎么形成的？看起来不像是天然形成的。'
    },
    {
      speaker: 'luna',
      text: '有一部分是水流冲刷出来的，还有一部分……是小荧光兽们世代踩出来的！'
    },
    {
      speaker: 'player',
      text: '小荧光兽？就是那些需要被引导回家的小家伙吗？'
    },
    {
      speaker: 'luna',
      text: '对呀！它们以发光植物为食，皮毛会折射出美丽的光芒。可它们天生胆小，一害怕就会迷路。'
    },
    {
      speaker: 'luna',
      text: '以前荧光植物长得多，光够亮，它们不会迷路。可是现在……'
    },
    {
      speaker: 'player',
      text: '因为生命之源在沉睡，植物越来越暗了，对吗？'
    },
    {
      speaker: 'luna',
      text: '嗯……所以你真的很重要！快，我们继续前进吧！'
    }
  ],
  level2After: [
    {
      speaker: 'luna',
      text: '太棒了！你看，那只小荧光兽安全回家了！'
    },
    {
      speaker: 'player',
      text: '它的毛发光起来真好看，像小灯笼一样。'
    },
    {
      speaker: 'luna',
      text: '它们的皮毛能反射荧光植物的光，所以才会亮晶晶的。'
    },
    {
      speaker: 'luna',
      text: '说起来，荧光蘑菇还有一个秘密呢——它们的孢子晚上会飘起来，像星星一样！'
    },
    {
      speaker: 'player',
      text: '哇，真想看看那样的景象。'
    },
    {
      speaker: 'elder',
      text: '等你唤醒了生命之源，整个洞穴都会恢复那样的光彩。'
    },
    {
      speaker: 'elder',
      text: '继续往深处走吧。下一个区域是「迷宫深处」，那里住着一只迷路很久的老荧光兽。'
    },
    {
      speaker: 'luna',
      text: '迷宫深处听说很复杂，引路人，你要小心哦！'
    }
  ],
  level3Before: [
    {
      speaker: 'elder',
      text: '这里就是迷宫深处了。洞穴形成初期，这里是地下河的主干道。'
    },
    {
      speaker: 'player',
      text: '这些纵横交错的通道，全是水流冲出来的？'
    },
    {
      speaker: 'elder',
      text: '正是。千百年的时光，水滴石穿，才有了今天的模样。'
    },
    {
      speaker: 'elder',
      text: '后来地下河改道，这里就成了迷宫。荧光植物在这儿长得格外茂盛。'
    },
    {
      speaker: 'player',
      text: '长老，您说您是第一株有灵智的苔藓……那其他植物呢？'
    },
    {
      speaker: 'elder',
      text: '苔藓是最基础的生命，吸收大地微弱的能量就能生长。但有灵智的不多。'
    },
    {
      speaker: 'elder',
      text: '越往深处，生命之源的能量越强，诞生的灵智生命也越多。'
    },
    {
      speaker: 'elder',
      text: '快去吧，那只老荧光兽在迷宫里转了好久了。'
    }
  ],
  level3After: [
    {
      speaker: 'elder',
      text: '做得好，引路人。那只老荧光兽终于回家了。'
    },
    {
      speaker: 'player',
      text: '它看起来好小，却在迷宫里待了那么久……真不容易。'
    },
    {
      speaker: 'rocky',
      text: '……光。来了。'
    },
    {
      speaker: 'player',
      text: '咦，是谁在说话？'
    },
    {
      speaker: 'luna',
      text: '呀，是小石灵！它们住在水晶矿脉里，很少出来的。'
    },
    {
      speaker: 'rocky',
      text: '我……小石灵。水晶，暗了。来找，光。'
    },
    {
      speaker: 'elder',
      text: '小石灵是水晶矿脉的守护者，由流星碎片的能量孕育而生。它们沉默寡言，却有着古老的智慧。'
    },
    {
      speaker: 'player',
      text: '你好，小石灵。我会让水晶重新亮起来的。'
    },
    {
      speaker: 'rocky',
      text: '……谢谢。前方，水晶回廊。我的，家。'
    }
  ],
  level4Before: [
    {
      speaker: 'rocky',
      text: '水晶回廊。到了。'
    },
    {
      speaker: 'player',
      text: '哇……好多水晶！虽然变暗了，但还是好美。'
    },
    {
      speaker: 'rocky',
      text: '这些水晶……流星的，碎片。千年，以前。'
    },
    {
      speaker: 'luna',
      text: '流星碎片原来变成了这些水晶啊！难怪它们会发光！'
    },
    {
      speaker: 'elder',
      text: '没错。千年前流星坠落，碎片散落在洞穴各处，化为了发光的水晶。'
    },
    {
      speaker: 'elder',
      text: '水晶的能量滋养了植物，植物养育了动物，这才有了今天的星辰洞穴。'
    },
    {
      speaker: 'player',
      text: '原来如此……整个洞穴的生态都建立在流星的馈赠之上。'
    },
    {
      speaker: 'rocky',
      text: '请，点亮它们。水晶，很久，没亮了。'
    }
  ],
  level4After: [
    {
      speaker: 'rocky',
      text: '水晶……亮了。好，温暖。'
    },
    {
      speaker: 'luna',
      text: '你看你看！水晶的光折射过来，整个通道都闪闪发亮！'
    },
    {
      speaker: 'player',
      text: '真美……就像星星落在了地上。'
    },
    {
      speaker: 'elder',
      text: '水晶不仅好看，它们释放的能量也是洞穴生物的食物来源之一。'
    },
    {
      speaker: 'elder',
      text: '小荧光兽有时候会舔食水晶表面的能量凝露，那对它们来说是最好的滋补。'
    },
    {
      speaker: 'player',
      text: '原来水晶在生态链里也这么重要。'
    },
    {
      speaker: 'rocky',
      text: '继续，向前。深渊边缘，危险。小心。'
    },
    {
      speaker: 'luna',
      text: '深渊……听起来好可怕。引路人，我们要去那里吗？'
    },
    {
      speaker: 'elder',
      text: '通往生命之源的路，必须经过深渊边缘。不用怕，有引路人在。'
    }
  ],
  level5Before: [
    {
      speaker: 'elder',
      text: '这里就是深渊边缘了。脚下就是无尽的黑暗。'
    },
    {
      speaker: 'player',
      text: '好深……完全看不到底。这下面有什么？'
    },
    {
      speaker: 'elder',
      text: '据说深渊连接着地底更深处的世界，但从没有人去过又回来。'
    },
    {
      speaker: 'luna',
      text: '呀——！别、别说了，好可怕……'
    },
    {
      speaker: 'rocky',
      text: '边缘的路，很窄。掉下去，危险。'
    },
    {
      speaker: 'player',
      text: '我明白了，我会小心的。'
    },
    {
      speaker: 'elder',
      text: '深渊附近生长着特殊的夜光花，它们的根能扎进岩壁深处，吸收更纯净的能量。'
    },
    {
      speaker: 'elder',
      text: '也正因为如此，夜光花是最珍稀的植物。'
    },
    {
      speaker: 'luna',
      text: '而且夜光花的花蜜特别甜！小荧光兽最喜欢了～'
    }
  ],
  level5After: [
    {
      speaker: 'luna',
      text: '呼……终于通过了！刚才我好怕掉下去……'
    },
    {
      speaker: 'player',
      text: '确实很惊险。不过这些在悬崖边生长的夜光花，真的很美。'
    },
    {
      speaker: 'elder',
      text: '夜光花只在能量充沛的地方生长，它们是洞穴生态的「风向标」。'
    },
    {
      speaker: 'elder',
      text: '夜光花盛开的地方，生命之源的力量就强。反之，则说明那里的生命在凋零。'
    },
    {
      speaker: 'player',
      text: '那生命之源……到底是什么？'
    },
    {
      speaker: 'elder',
      text: '传说中位于洞穴最深处的神秘泉水，是所有洞穴生命的起源。'
    },
    {
      speaker: 'elder',
      text: '据说它能让枯萎的植物重新焕发生机，能让生病的小生物恢复健康。'
    },
    {
      speaker: 'rocky',
      text: '前方，古树根系。母亲树，守护。'
    },
    {
      speaker: 'luna',
      text: '母亲树？是什么呀？'
    },
    {
      speaker: 'elder',
      text: '去看看就知道了。那是整个洞穴最神奇的存在。'
    }
  ],
  level6Before: [
    {
      speaker: 'luna',
      text: '哇……好大的树！这些根须好壮观！'
    },
    {
      speaker: 'player',
      text: '这棵树……是从地表一直长到这里的吗？'
    },
    {
      speaker: 'elder',
      text: '正是。千年前的流星带来了一颗种子，它在黑暗中扎根，向下生长。'
    },
    {
      speaker: 'elder',
      text: '这棵古树的根系贯穿了整个洞穴，是所有生命的支柱。'
    },
    {
      speaker: 'player',
      text: '太不可思议了……一棵树居然撑起了一整个地下世界。'
    },
    {
      speaker: 'rocky',
      text: '母亲树，给营养。水晶，吸收，再释放。'
    },
    {
      speaker: 'elder',
      text: '古树的根系输送养分，水晶转化能量，植物生长，动物生存——这就是洞穴的完整生态。'
    },
    {
      speaker: 'player',
      text: '原来如此……每一环都紧紧相扣。'
    },
    {
      speaker: 'bloom',
      text: '……光的气息。久违了。'
    },
    {
      speaker: 'luna',
      text: '谁？谁在说话？'
    }
  ],
  level6After: [
    {
      speaker: 'bloom',
      text: '我是花之灵……夜光花的化身。'
    },
    {
      speaker: 'player',
      text: '花之灵？你一直在这里吗？'
    },
    {
      speaker: 'bloom',
      text: '我诞生于生命之源最旺盛的年代。后来……光芒渐暗，我便沉睡了。'
    },
    {
      speaker: 'bloom',
      text: '是你点亮的植物，唤醒了我。'
    },
    {
      speaker: 'luna',
      text: '哇——好漂亮的姐姐！你身上有花香！'
    },
    {
      speaker: 'bloom',
      text: '谢谢你，小蝴蝶。你的翅膀，也很美。'
    },
    {
      speaker: 'elder',
      text: '花之灵是洞穴中最古老的灵智生命之一，连我都要尊称她一声前辈。'
    },
    {
      speaker: 'bloom',
      text: '长老过奖了。引路人，谢谢你……一路走到这里。'
    },
    {
      speaker: 'bloom',
      text: '再往前，就是萤火湖泊了。那里有更多夜光花，也……更接近生命之源。'
    },
    {
      speaker: 'player',
      text: '我明白了。我们继续前进吧。'
    }
  ],
  level7Before: [
    {
      speaker: 'bloom',
      text: '这就是萤火湖泊。'
    },
    {
      speaker: 'player',
      text: '好美……水面上全是萤火虫，像星星落在了水里。'
    },
    {
      speaker: 'bloom',
      text: '这些萤火虫，是夜光花的守护者。它们靠花蜜为生，也帮花朵传播花粉。'
    },
    {
      speaker: 'luna',
      text: '哇——它们和我一样会发光！我们可以做朋友！'
    },
    {
      speaker: 'bloom',
      text: '月光萤……你的鳞粉有神奇的力量，能让光变得更柔和。'
    },
    {
      speaker: 'player',
      text: '湖中好像有什么东西在旋转……'
    },
    {
      speaker: 'bloom',
      text: '那是漩涡。湖水是地下河的一部分，水流在湖底形成了危险的漩涡。'
    },
    {
      speaker: 'bloom',
      text: '一定要沿着安全的路径前进，不要踏错一步。'
    },
    {
      speaker: 'rocky',
      text: '漩涡，危险。会，卷走。'
    },
    {
      speaker: 'player',
      text: '我会小心的。大家等我通过。'
    }
  ],
  level7After: [
    {
      speaker: 'bloom',
      text: '做得好，引路人。湖对岸的夜光花，都亮起来了。'
    },
    {
      speaker: 'luna',
      text: '这些萤火虫围着我转！它们好可爱！'
    },
    {
      speaker: 'player',
      text: '花之灵，这里离生命之源还有多远？'
    },
    {
      speaker: 'bloom',
      text: '已经不远了。穿过前面的晶簇密林，再经过远古圣殿，就能到达。'
    },
    {
      speaker: 'bloom',
      text: '晶簇密林是水晶最密集的区域，能量也是最强的。'
    },
    {
      speaker: 'elder',
      text: '听说那里是古代守护者修炼的地方。'
    },
    {
      speaker: 'player',
      text: '古代守护者？'
    },
    {
      speaker: 'elder',
      text: '在你之前，洞穴也曾有过「引路人」。他们是古代文明的守护者。'
    },
    {
      speaker: 'elder',
      text: '不过那都是很久很久以前的事了。走吧，到了晶簇密林，我再慢慢讲给你听。'
    }
  ],
  level8Before: [
    {
      speaker: 'rocky',
      text: '晶簇密林。我的，出生地。'
    },
    {
      speaker: 'player',
      text: '这些水晶好高……像一片发光的森林。'
    },
    {
      speaker: 'elder',
      text: '这些水晶是流星的核心碎片，能量最强。'
    },
    {
      speaker: 'elder',
      text: '很久以前，古代的守护者们就在这里修炼。他们能和水晶共鸣，释放强大的力量。'
    },
    {
      speaker: 'player',
      text: '古代守护者……他们和我有什么关系吗？'
    },
    {
      speaker: 'elder',
      text: '你的血脉里，流淌着他们的力量。不然，你怎么能点亮荧光植物呢？'
    },
    {
      speaker: 'bloom',
      text: '每一代引路人，都是守护者的后裔。这是命运的传承。'
    },
    {
      speaker: 'player',
      text: '命运的传承……'
    },
    {
      speaker: 'bloom',
      text: '不用急着接受。等你到达生命之源，一切答案都会揭晓。'
    },
    {
      speaker: 'luna',
      text: '不管怎么样，我相信引路人！我们继续加油！'
    }
  ],
  level8After: [
    {
      speaker: 'bloom',
      text: '水晶全部亮起了……久违的光芒。'
    },
    {
      speaker: 'rocky',
      text: '感觉到了。能量，在流动。'
    },
    {
      speaker: 'elder',
      text: '再往前，就是远古圣殿了。'
    },
    {
      speaker: 'player',
      text: '古代文明建造的圣殿吗？'
    },
    {
      speaker: 'elder',
      text: '对。千年前，发现这个洞穴的先民们建造了它，用来守护生命之源。'
    },
    {
      speaker: 'elder',
      text: '他们就是第一代「引路人」。他们留下了机关，只有真正的引路人才能通过。'
    },
    {
      speaker: 'luna',
      text: '听起来好厉害！引路人，你一定可以的！'
    },
    {
      speaker: 'bloom',
      text: '圣殿之后，就是生命之源了。引路人，准备好了吗？'
    },
    {
      speaker: 'player',
      text: '我准备好了。走吧，去解开一切的答案。'
    }
  ],
  level9Before: [
    {
      speaker: 'elder',
      text: '这就是远古圣殿。千年前的守护者们，在这里留下了他们的智慧。'
    },
    {
      speaker: 'player',
      text: '这些符文……好古老，但我好像能看懂一点点。'
    },
    {
      speaker: 'bloom',
      text: '因为你的血脉里有守护者的记忆。这是刻在灵魂里的传承。'
    },
    {
      speaker: 'elder',
      text: '圣殿里的机关，是为了考验引路人而设。'
    },
    {
      speaker: 'elder',
      text: '只有智慧、勇气、善良兼备的人，才能走到最后。'
    },
    {
      speaker: 'player',
      text: '智慧、勇气、善良……'
    },
    {
      speaker: 'luna',
      text: '引路人都有呀！你看，你点亮植物帮助小动物——这就是善良！'
    },
    {
      speaker: 'rocky',
      text: '能走到，这里。勇气，足够。'
    },
    {
      speaker: 'bloom',
      text: '而你每一关都找到了正确的路径——这就是智慧。'
    },
    {
      speaker: 'player',
      text: '谢谢大家……我不会让你们失望的。'
    }
  ],
  level9After: [
    {
      speaker: 'elder',
      text: '你通过了圣殿的考验。你果然是真正的引路人。'
    },
    {
      speaker: 'player',
      text: '这些机关……好像在我做出选择的时候，就自动打开了。'
    },
    {
      speaker: 'bloom',
      text: '因为你做出了正确的选择。生命之源，会回应纯净的心灵。'
    },
    {
      speaker: 'player',
      text: '前面就是最后一关了吗？生命之源就在那里？'
    },
    {
      speaker: 'elder',
      text: '是的。「生命之源」——这是最后的试炼。'
    },
    {
      speaker: 'luna',
      text: '我好期待……又有点紧张。引路人，我们陪你一起！'
    },
    {
      speaker: 'rocky',
      text: '一起。'
    },
    {
      speaker: 'bloom',
      text: '我们都在这里。你不是一个人。'
    },
    {
      speaker: 'player',
      text: '嗯！有大家在，我什么都不怕。我们走吧——去唤醒生命之源！'
    }
  ],
  level10Before: [
    {
      speaker: 'elder',
      text: '到了……生命之源就在前方。'
    },
    {
      speaker: 'player',
      text: '虽然光很微弱，但我能感觉到……强大的生命力。'
    },
    {
      speaker: 'bloom',
      text: '很久以前，这里的光芒能照亮整个洞穴。花会开，水会流，生机勃勃。'
    },
    {
      speaker: 'luna',
      text: '好想看那样的景象……一定很美吧。'
    },
    {
      speaker: 'rocky',
      text: '水晶，全部亮起来。整个洞穴，像白昼。'
    },
    {
      speaker: 'elder',
      text: '引路人，这是最后的路。点亮沿途所有的植物，生命之源就会感应到你的力量。'
    },
    {
      speaker: 'elder',
      text: '它会苏醒——整个洞穴，都会重获新生。'
    },
    {
      speaker: 'player',
      text: '我明白了。大家，等我的好消息。'
    },
    {
      speaker: 'bloom',
      text: '一路小心。我们在这里，等你回来。'
    },
    {
      speaker: 'luna',
      text: '加油！引路人最棒了！'
    }
  ],
  epilogue: [
    {
      speaker: 'elder',
      text: '苏醒了……生命之源，苏醒了！'
    },
    {
      speaker: 'luna',
      text: '哇！整个洞穴都亮起来了！好漂亮——！'
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
      speaker: 'player',
      text: '好温暖的光……就像太阳一样。'
    },
    {
      speaker: 'elder',
      text: '引路人，你做到了。整个洞穴生态都因你而重获新生。'
    },
    {
      speaker: 'bloom',
      text: '从今天起，你就是星辰洞穴的正式守护者了。'
    },
    {
      speaker: 'luna',
      text: '太好了！以后我们就是朋友啦！要常来看我们哦！'
    },
    {
      speaker: 'rocky',
      text: '……欢迎回家。'
    },
    {
      speaker: 'player',
      text: '谢谢大家……不，这不是我一个人的功劳。'
    },
    {
      speaker: 'player',
      text: '是长老的指引，是月光萤的陪伴，是小石灵的守护，是花之灵的信任。'
    },
    {
      speaker: 'player',
      text: '我们一起，唤醒了生命之源。'
    },
    {
      speaker: 'bloom',
      text: '说得真好。引路人，星辰洞穴的大门，永远为你敞开。'
    },
    {
      speaker: 'elder',
      text: '愿光，永远与你同在。'
    },
    {
      speaker: 'luna',
      text: '下次来，我带你去看流星坠落的地方！'
    },
    {
      speaker: 'rocky',
      text: '水晶，会为你，发光。'
    },
    {
      speaker: 'player',
      text: '一言为定。我一定会回来的。'
    },
    {
      speaker: 'elder',
      text: '——故事模式 完——'
    }
  ]
}

export const getDialogueForLevel = (levelIndex, isBefore) => {
  const dialogueKey = `level${levelIndex + 1}${isBefore ? 'Before' : 'After'}`
  if (STORY_DIALOGUES[dialogueKey]) {
    return STORY_DIALOGUES[dialogueKey]
  }
  
  if (levelIndex >= 9 && !isBefore) {
    return STORY_DIALOGUES.epilogue
  }
  
  return null
}

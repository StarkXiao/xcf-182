/* ============================================================
 *  排行榜云端功能完整测试脚本
 *  ============================================================
 *  运行方式：
 *    1. 安装依赖：npm install
 *    2. 本地模式测试（默认，无需配置）：
 *         node tests/leaderboard.test.mjs
 *    3. LeanCloud 云端测试：
 *         VITE_LEANCLOUD_APP_ID=xxx VITE_LEANCLOUD_APP_KEY=yyy \
 *         [VITE_LEANCLOUD_SERVER_URL=zzz] \
 *         LEADERBOARD_BACKEND=leancloud \
 *         node tests/leaderboard.test.mjs
 *    4. Supabase 云端测试：
 *         VITE_SUPABASE_URL=https://xxx.supabase.co \
 *         VITE_SUPABASE_ANON_KEY=yyy \
 *         LEADERBOARD_BACKEND=supabase \
 *         node tests/leaderboard.test.mjs
 * ============================================================ */

import { getLeaderboardService, generateRandomNickname } from '../src/game/modules/LeaderboardService.js'

const BAR = '═'.repeat(62)
const THIN_BAR = '─'.repeat(62)
const LEVEL_NAMES = [
  '', '微光初现', '蜿蜒小径', '迷宫深处', '水晶回廊',
  '深渊边缘', '古树根系', '萤火湖泊', '晶簇密林',
  '远古圣殿', '生命之源'
]

const TEST_CONFIG = {
  levelCount: 10,
  entriesPerLevel: 60,
  topN: 50,
  nicknamePoolSize: 25
}

const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
}

const passed = []
const failed = []

function title(t) {
  console.log()
  console.log(`${COLOR.bold}${COLOR.cyan}${BAR}${COLOR.reset}`)
  console.log(`${COLOR.bold}${COLOR.cyan}  ${t}${COLOR.reset}`)
  console.log(`${COLOR.bold}${COLOR.cyan}${BAR}${COLOR.reset}`)
}

function section(t) {
  console.log()
  console.log(`${COLOR.bold}${COLOR.blue}▸ ${t}${COLOR.reset}`)
  console.log(`${COLOR.dim}${THIN_BAR}${COLOR.reset}`)
}

function check(name, cond, detail = '') {
  if (cond) {
    passed.push(name)
    console.log(`  ${COLOR.green}✓${COLOR.reset} ${COLOR.white}${name}${COLOR.reset}${detail ? ' ' + COLOR.dim + '(' + detail + ')' + COLOR.reset : ''}`)
  } else {
    failed.push(name)
    console.log(`  ${COLOR.red}✗${COLOR.reset} ${COLOR.white}${name}${COLOR.reset}${detail ? ' ' + COLOR.red + '(' + detail + ')' + COLOR.reset : ''}`)
  }
  return !!cond
}

function info(msg) {
  console.log(`  ${COLOR.dim}ℹ ${msg}${COLOR.reset}`)
}

function ok(msg) {
  console.log(`  ${COLOR.green}✓ ${msg}${COLOR.reset}`)
}

function warn(msg) {
  console.log(`  ${COLOR.yellow}⚠ ${msg}${COLOR.reset}`)
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 100)
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function printTop3(levelId, scores) {
  if (!scores || scores.length === 0) {
    info(`第 ${levelId} 关暂无数据`)
    return
  }
  const medals = ['🥇', '🥈', '🥉']
  scores.slice(0, 3).forEach((e, i) => {
    console.log(`    ${medals[i] || '  '} #${i + 1}  ${e.nickname.padEnd(14, ' ')}  得分 ${String(e.score).padStart(4)}  用时 ${formatTime(e.time)}`)
  })
  if (scores.length > 3) {
    console.log(`    ${COLOR.dim}... 还有 ${scores.length - 3} 条记录${COLOR.reset}`)
  }
}

function generateNicknames(n) {
  const set = new Set()
  while (set.size < n) set.add(generateRandomNickname())
  return Array.from(set)
}

function randomScore() {
  return Math.floor(Math.random() * 200) + 50
}

function randomTime() {
  return +(Math.random() * 180 + 10).toFixed(3)
}

/* ------------------------------------------------------------
 *  主测试流程
 * ------------------------------------------------------------ */

async function runTests() {
  console.log()
  console.log(`${COLOR.bold}${COLOR.bgGreen} ${COLOR.white} 苔藓洞穴引路人 - 排行榜功能完整测试 ${COLOR.reset}`)

  const service = getLeaderboardService()

  /* --------------- T1: 服务初始化 & 后端类型 --------------- */
  title('T1 · 服务初始化与后端检测')

  section('等待后端就绪')
  const ready = await service.ensureBackendReady()
  const backendType = service.getBackendType()
  const isCloud = service.isCloudBackend()

  check('服务实例化成功', service != null)
  check('后端就绪标志为 true', service.backendReady === true, 'ensureBackendReady returned ' + ready)
  check('后端类型识别正确', ['local', 'leancloud', 'supabase'].includes(backendType), backendType)
  check('云端标志与类型一致', isCloud === (backendType !== 'local'), `isCloud=${isCloud}`)

  if (backendType === 'local') {
    info('当前使用本地存储模式 (可通过环境变量切换到云端)')
  } else {
    ok(`已连接云端后端: ${backendType.toUpperCase()}`)
  }

  /* ------------------- T2: 昵称功能 ------------------- */
  title('T2 · 匿名昵称生成与管理')

  section('昵称读写测试')
  const initial = service.getNickname()
  check('初始昵称自动生成', typeof initial === 'string' && initial.length >= 4, initial)

  service.setNickname('测试玩家_ABC')
  check('设置昵称生效', service.getNickname() === '测试玩家_ABC')

  const newOne = service.generateNewNickname()
  check('重新生成昵称', typeof newOne === 'string' && newOne.length >= 4 && newOne !== '测试玩家_ABC', newOne)

  section('昵称生成唯一性抽查')
  const sample = generateNicknames(500)
  const uniqueRatio = new Set(sample).size / sample.length
  check('500 次生成重复率 < 5%', uniqueRatio > 0.95, `唯一率 ${(uniqueRatio * 100).toFixed(1)}%`)

  // 恢复一个稳定昵称用于后续测试
  service.setNickname('排行榜测试员')

  /* ------------------- T3: 写入压力测试 ------------------- */
  title('T3 · 写入压力测试')

  const nicknames = generateNicknames(TEST_CONFIG.nicknamePoolSize)
  info(`测试 ${TEST_CONFIG.levelCount} 个关卡，每关写入 ${TEST_CONFIG.entriesPerLevel} 条`)
  info(`使用 ${nicknames.length} 个不同的随机昵称`)

  let totalWriteMs = 0
  const writeResults = []

  for (let level = 1; level <= TEST_CONFIG.levelCount; level++) {
    section(`第 ${level} 关「${LEVEL_NAMES[level]}」 - 写入 ${TEST_CONFIG.entriesPerLevel} 条`)
    const t0 = performance.now()

    const levelWrites = []
    for (let i = 0; i < TEST_CONFIG.entriesPerLevel; i++) {
      const nick = nicknames[Math.floor(Math.random() * nicknames.length)]
      const score = randomScore()
      const time = randomTime()
      service.setNickname(nick)
      levelWrites.push(
        service.submitScore(level, score, time).catch(err => ({ error: String(err) }))
      )
    }

    const results = await Promise.all(levelWrites)
    const t1 = performance.now()
    const dt = t1 - t0
    totalWriteMs += dt

    const successCount = results.filter(r => r && r.success).length
    const avgRank = results.filter(r => r && r.success).reduce((s, r) => s + r.rank, 0) / (successCount || 1)

    const allOk = results.every(r => r && !r.error && r.success)
    check(
      `写入全部成功`,
      allOk,
      `${successCount}/${TEST_CONFIG.entriesPerLevel} 成功, 耗时 ${dt.toFixed(0)}ms, 平均排名 ${avgRank.toFixed(1)}`
    )

    if (!allOk) {
      const firstFail = results.find(r => r.error)
      if (firstFail) warn('首个错误: ' + firstFail.error)
    }
    writeResults.push({ level, results, dt })
  }

  info(`总写入耗时: ${totalWriteMs.toFixed(0)}ms, 平均 ${(totalWriteMs / (TEST_CONFIG.levelCount * TEST_CONFIG.entriesPerLevel)).toFixed(2)}ms/条`)

  /* ------------------- T4: 读取排行榜 ------------------- */
  title('T4 · 排行榜读取与排序验证')

  const readPromises = []
  for (let level = 1; level <= TEST_CONFIG.levelCount; level++) {
    readPromises.push(service.getTopScores(level, TEST_CONFIG.topN))
  }
  const tRead0 = performance.now()
  const allTop = await Promise.all(readPromises)
  const tRead1 = performance.now()

  info(`并行读取 ${TEST_CONFIG.levelCount} 个关卡前 ${TEST_CONFIG.topN} 名，耗时 ${(tRead1 - tRead0).toFixed(0)}ms`)

  let sortErrors = 0
  for (let level = 1; level <= TEST_CONFIG.levelCount; level++) {
    const scores = allTop[level - 1]

    section(`第 ${level} 关「${LEVEL_NAMES[level]}」 - 排行榜校验`)

    check(`返回记录数 ≤ ${TEST_CONFIG.topN}`, scores.length <= TEST_CONFIG.topN, `实际 ${scores.length} 条`)
    check(`返回记录数 ≥ 1`, scores.length >= 1)

    // 排序验证
    let sortOk = true
    for (let i = 1; i < scores.length; i++) {
      const prev = scores[i - 1]
      const curr = scores[i]
      if (prev.score < curr.score) { sortOk = false; break }
      if (prev.score === curr.score && prev.time > curr.time) { sortOk = false; break }
    }
    if (!sortOk) sortErrors++
    check(`排序正确 (得分降序 → 用时升序)`, sortOk)

    // 字段完整性
    const fieldsOk = scores.every(e =>
      typeof e.nickname === 'string' &&
      Number.isFinite(e.score) && e.score >= 0 &&
      Number.isFinite(e.time) && e.time >= 0
    )
    check(`字段完整性`, fieldsOk)

    printTop3(level, scores)
  }

  check(`所有关卡排序正确`, sortErrors === 0, sortErrors ? `${sortErrors} 关排序错误` : '全部正确')

  /* ------------------- T5: 个人最佳查询 ------------------- */
  title('T5 · 个人最佳成绩查询')

  service.setNickname('排行榜测试员')
  // 先插入一条高分
  const myScore = 9999
  const myTime = 0.123
  await service.submitScore(1, myScore, myTime)

  section('第 1 关个人最佳')
  const best = await service.getUserBestScore(1)

  check(`个人最佳查询返回记录`, best != null)
  if (best) {
    check(`昵称匹配`, best.nickname === '排行榜测试员', best.nickname)
    check(`得分匹配`, best.score === myScore, `${best.score} == ${myScore}`)
    check(`用时匹配`, Math.abs(best.time - myTime) < 0.1, `${best.time} ≈ ${myTime}`)
    ok(`我的最佳: ${best.score} 分 / ${formatTime(best.time)}`)
  }

  /* ------------------- T6: 排名准确性 ------------------- */
  title('T6 · 提交后返回排名准确性验证')

  section('第 5 关排名验证（写入 100 条梯度数据）')

  // 清空本地存储的第5关（仅本地模式有效），然后写入 100 条严格梯度数据
  // 得分从 1000 到 100，时间从 1s 到 100s
  service.setNickname('梯度测试')
  const gradientResults = []
  for (let i = 100; i >= 1; i--) {
    const score = i * 10        // 1000, 990, 980 ... 10
    const time = (101 - i) * 1 // 1, 2, 3 ... 100
    const r = await service.submitScore(5, score, time)
    gradientResults.push({ score, time, returnedRank: r.success ? r.rank : null })
  }

  // 读前 50，验证严格递减
  const top50 = await service.getTopScores(5, 50)
  let strictlySorted = true
  for (let i = 1; i < top50.length; i++) {
    if (top50[i - 1].score <= top50[i].score) { strictlySorted = false; break }
  }
  check(`梯度数据后前 50 严格按得分排序`, strictlySorted, `首条得分 ${top50[0]?.score}, 第 50 条 ${top50[49]?.score}`)
  check(`梯度数据后前 50 第一名得分 = 1000`, top50[0]?.score === 1000, `实际 ${top50[0]?.score}`)
  check(`梯度数据后前 50 第一名用时 = 1.000`, Math.abs(top50[0]?.time - 1.0) < 0.01, `实际 ${top50[0]?.time}`)
  check(`梯度数据后前 50 共 ${top50.length} 条`, top50.length === 50 || top50.length === 60)

  // 检查最后一条梯度 (score=10, time=100) 的排名
  const lastGrad = gradientResults[gradientResults.length - 1]
  if (lastGrad.returnedRank != null) {
    check(`最低分返回排名 ≥ 100（本地截断前100时=100，云端≥160）`,
      lastGrad.returnedRank >= 100,
      `返回排名 #${lastGrad.returnedRank}`
    )
  }
  printTop3(5, top50)

  /* ------------------- T7: 工具函数 ------------------- */
  title('T7 · 格式化工具函数')

  const t1 = service.formatTime(91.234)
  const t2 = service.formatTime(3723.5678)
  check('formatTime(91.234) → 01:31.23', t1 === '01:31.23', t1)
  check('formatTime(3723.5678) → 62:03.56', t2 === '62:03.56', t2)

  /* -------------------------------------------------------
   *  最终总结
   * ----------------------------------------------------- */
  console.log()
  console.log(`${COLOR.bold}${BAR}${COLOR.reset}`)
  if (failed.length === 0) {
    console.log(`${COLOR.bold}${COLOR.bgGreen}${COLOR.white}  🎉 全部 ${passed.length} 项测试通过!  ${COLOR.reset}`)
  } else {
    console.log(`${COLOR.bold}${COLOR.bgRed}${COLOR.white}  ❌ ${failed.length}/${passed.length + failed.length} 项失败  ${COLOR.reset}`)
    console.log()
    console.log(`${COLOR.red}失败项:${COLOR.reset}`)
    failed.forEach(f => console.log(`  - ${f}`))
  }
  console.log(`${COLOR.bold}${BAR}${COLOR.reset}`)
  console.log()
  console.log(`${COLOR.dim}后端模式: ${backendType}${isCloud ? ' (云端已配置)' : ' (本地存储)'}`)
  console.log(`如需云端模式, 设置 LEADERBOARD_BACKEND + 对应密钥后重新运行`)
  console.log()

  process.exit(failed.length === 0 ? 0 : 1)
}

runTests().catch(err => {
  console.error(COLOR.red + 'FATAL: 测试脚本崩溃:' + COLOR.reset, err)
  process.exit(2)
})

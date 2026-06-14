import { getLeaderboardService, generateRandomNickname } from './src/game/modules/LeaderboardService.js'

const LEVEL_COUNT = 10
const ENTRIES_PER_LEVEL = 60
const NICKNAMES = Array.from({ length: 20 }, () => generateRandomNickname())

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('\n=== 🧪 排行榜云端功能测试 ===\n')

  const service = getLeaderboardService()
  const ready = await service.ensureBackendReady()
  console.log(`[1] 后端类型: ${service.getBackendType()}`)
  console.log(`[1] 云端连接: ${ready ? '✅ 成功' : '⚠️  使用本地'}`)
  console.log()

  console.log(`[2] 随机生成测试昵称: ${service.getNickname()}`)
  console.log()

  console.log(`[3] 批量写入 ${LEVEL_COUNT} 个关卡各 ${ENTRIES_PER_LEVEL} 条记录...`)
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const writes = []
    for (let i = 0; i < ENTRIES_PER_LEVEL; i++) {
      const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]
      const score = Math.floor(Math.random() * 200) + 50
      const time = Math.random() * 180 + 10
      service.setNickname(nickname)
      writes.push(service.submitScore(level, score, time))
    }
    await Promise.all(writes)
    process.stdout.write(`  - 第 ${level} 关写入完成 ✓\n`)
  }
  console.log()

  console.log('[4] 读取每个关卡前 50 名排行榜并验证...')
  let allPassed = true
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const top50 = await service.getTopScores(level, 50)
    const isSorted = top50.every((e, i) => {
      if (i === 0) return true
      const prev = top50[i - 1]
      if (prev.score !== e.score) return prev.score > e.score
      return prev.time <= e.time
    })
    const hasCorrectCount = top50.length <= 50
    const ok = isSorted && hasCorrectCount
    if (!ok) allPassed = false
    console.log(`  - 第 ${level} 关: ${top50.length} 条, 排序${isSorted ? '✅' : '❌'}, 数量限制${hasCorrectCount ? '✅' : '❌'}  第1名: ${top50[0]?.nickname} (${top50[0]?.score}分, ${top50[0]?.time?.toFixed(2)}s)`)
  }
  console.log()

  service.setNickname('测试玩家_验证')
  await service.submitScore(1, 9999, 0.01)
  const best = await service.getUserBestScore(1)
  console.log(`[5] 个人最佳查询: ${best ? '✅ ' + best.nickname + ' ' + best.score + '分' : '❌ 失败'}`)
  console.log()

  console.log(`=== 测试结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'} ===\n`)
}

main().catch(console.error)

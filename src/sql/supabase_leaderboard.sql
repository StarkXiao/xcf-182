-- ============================================================
-- 苔藓洞穴引路人 - 排行榜数据表 (Supabase / PostgreSQL)
-- 在 Supabase 控制台 -> SQL Editor 中执行此脚本
-- ============================================================

-- 1. 创建排行榜表
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id    varchar(16) NOT NULL,
    nickname    varchar(32) NOT NULL,
    score       integer NOT NULL CHECK (score >= 0),
    time        double precision NOT NULL CHECK (time >= 0),
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. 创建复合索引：按关卡查排行，先按得分降序再按时间升序
CREATE INDEX IF NOT EXISTS idx_leaderboard_level_score_time
    ON public.leaderboard (level_id, score DESC, time ASC);

-- 3. 创建单独索引：按关卡查询
CREATE INDEX IF NOT EXISTS idx_leaderboard_level_id
    ON public.leaderboard (level_id);

-- 4. 启用行级安全 (RLS)
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 5. 允许所有人读取排行榜 (SELECT)
DROP POLICY IF EXISTS "Allow read leaderboard" ON public.leaderboard;
CREATE POLICY "Allow read leaderboard"
    ON public.leaderboard
    FOR SELECT
    USING (true);

-- 6. 允许所有人提交成绩 (INSERT)
DROP POLICY IF EXISTS "Allow insert leaderboard" ON public.leaderboard;
CREATE POLICY "Allow insert leaderboard"
    ON public.leaderboard
    FOR INSERT
    WITH CHECK (true);

-- 7. (可选) 限制 nickname 长度，防止垃圾数据
-- DROP POLICY IF EXISTS "Validate nickname length" ON public.leaderboard;
-- CREATE POLICY "Validate nickname length"
--     ON public.leaderboard
--     FOR INSERT
--     WITH CHECK (char_length(nickname) <= 12);

-- ============================================================
-- 验证脚本：执行完上面后可运行以下查询测试
-- ============================================================

-- 插入一条测试数据
-- INSERT INTO public.leaderboard (level_id, nickname, score, time)
-- VALUES ('1', '测试玩家', 100, 30.5);

-- 读取第1关前50名
-- SELECT nickname, score, time, created_at
-- FROM public.leaderboard
-- WHERE level_id = '1'
-- ORDER BY score DESC, time ASC
-- LIMIT 50;

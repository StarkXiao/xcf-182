-- ============================================================
-- 苔藓洞穴引路人 - 创意工坊数据表 (Supabase / PostgreSQL)
-- 在 Supabase 控制台 -> SQL Editor 中执行此脚本
-- ============================================================

-- 1. 创建创意工坊关卡表
CREATE TABLE IF NOT EXISTS public.workshop_levels (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_nickname varchar(32) NOT NULL,
    name            varchar(64) NOT NULL,
    description     varchar(256),
    hint            varchar(256),
    grid_rows       integer NOT NULL CHECK (grid_rows >= 3 AND grid_rows <= 15),
    grid_cols       integer NOT NULL CHECK (grid_cols >= 3 AND grid_cols <= 15),
    start_pos       jsonb NOT NULL,
    end_pos         jsonb NOT NULL,
    obstacles       jsonb NOT NULL DEFAULT '[]'::jsonb,
    plants          jsonb NOT NULL DEFAULT '[]'::jsonb,
    correct_path    jsonb NOT NULL,
    likes_count     integer NOT NULL DEFAULT 0,
    plays_count     integer NOT NULL DEFAULT 0,
    total_points    integer NOT NULL DEFAULT 0,
    hot_score       integer NOT NULL DEFAULT 0,
    is_approved     boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 1b. 如果表已存在但缺少 hot_score 列，手动执行：
-- ALTER TABLE public.workshop_levels ADD COLUMN IF NOT EXISTS hot_score integer NOT NULL DEFAULT 0;
-- 然后回填：
-- UPDATE public.workshop_levels SET hot_score = likes_count * 3 + plays_count;

-- 2. 创建点赞记录表（防止重复点赞）
CREATE TABLE IF NOT EXISTS public.workshop_likes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id        uuid NOT NULL REFERENCES public.workshop_levels(id) ON DELETE CASCADE,
    nickname        varchar(32) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE(level_id, nickname)
);

-- 3. 创建索引：按热度排序（hot_score = likes_count * 3 + plays_count）
DROP INDEX IF EXISTS idx_workshop_levels_hot;
CREATE INDEX IF NOT EXISTS idx_workshop_levels_hot
    ON public.workshop_levels (hot_score DESC, created_at DESC);

-- 4. 创建索引：按最新排序
CREATE INDEX IF NOT EXISTS idx_workshop_levels_newest
    ON public.workshop_levels (created_at DESC);

-- 5. 创建索引：按作者查询
CREATE INDEX IF NOT EXISTS idx_workshop_levels_author
    ON public.workshop_levels (author_nickname);

-- 6. 启用行级安全 (RLS)
ALTER TABLE public.workshop_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_likes ENABLE ROW LEVEL SECURITY;

-- 7. 关卡表策略：允许所有人读取
DROP POLICY IF EXISTS "Allow read workshop levels" ON public.workshop_levels;
CREATE POLICY "Allow read workshop levels"
    ON public.workshop_levels
    FOR SELECT
    USING (true);

-- 8. 关卡表策略：允许所有人上传
DROP POLICY IF EXISTS "Allow insert workshop levels" ON public.workshop_levels;
CREATE POLICY "Allow insert workshop levels"
    ON public.workshop_levels
    FOR INSERT
    WITH CHECK (true);

-- 9. 点赞表策略：允许所有人读取
DROP POLICY IF EXISTS "Allow read workshop likes" ON public.workshop_likes;
CREATE POLICY "Allow read workshop likes"
    ON public.workshop_likes
    FOR SELECT
    USING (true);

-- 10. 点赞表策略：允许所有人插入
DROP POLICY IF EXISTS "Allow insert workshop likes" ON public.workshop_likes;
CREATE POLICY "Allow insert workshop likes"
    ON public.workshop_likes
    FOR INSERT
    WITH CHECK (true);

-- 11. 点赞表策略：允许所有人删除（取消点赞）
DROP POLICY IF EXISTS "Allow delete workshop likes" ON public.workshop_likes;
CREATE POLICY "Allow delete workshop likes"
    ON public.workshop_likes
    FOR DELETE
    USING (true);

-- 12. 创建更新点赞数 + hot_score 的触发器函数
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.workshop_levels
        SET likes_count = likes_count + 1,
            hot_score   = (likes_count + 1) * 3 + plays_count
        WHERE id = NEW.level_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.workshop_levels
        SET likes_count = GREATEST(likes_count - 1, 0),
            hot_score   = GREATEST(likes_count - 1, 0) * 3 + plays_count
        WHERE id = OLD.level_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 13. 创建点赞触发器
DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.workshop_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON public.workshop_likes
FOR EACH ROW
EXECUTE FUNCTION update_likes_count();

-- 14. 创建游玩次数自增 RPC 函数（供客户端 .rpc() 调用）
CREATE OR REPLACE FUNCTION increment_workshop_play_count(level_id uuid)
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.workshop_levels
    SET plays_count = plays_count + 1,
        hot_score   = likes_count * 3 + (plays_count + 1)
    WHERE id = level_id;
END;
$$;

-- ============================================================
-- 验证脚本
-- ============================================================

-- 插入一条测试关卡
-- INSERT INTO public.workshop_levels (
--     author_nickname, name, description, hint,
--     grid_rows, grid_cols, start_pos, end_pos,
--     obstacles, plants, correct_path, total_points
-- ) VALUES (
--     '测试作者', '测试关卡', '这是一个测试关卡', '从起点走到终点',
--     5, 5, '{"row":0,"col":0}', '{"row":4,"col":4}',
--     '[]', '[]', '[{"row":0,"col":0},{"row":4,"col":4}]', 100
-- );

-- 测试游玩计数自增
-- SELECT increment_workshop_play_count('此处替换为关卡uuid');

-- 按热度获取关卡列表
-- SELECT *, (likes_count * 3 + plays_count) AS computed_hot
-- FROM public.workshop_levels
-- WHERE is_approved = true
-- ORDER BY hot_score DESC, created_at DESC
-- LIMIT 20;

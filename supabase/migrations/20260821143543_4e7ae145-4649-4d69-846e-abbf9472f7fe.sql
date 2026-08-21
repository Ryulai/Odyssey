ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ability text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ability_zh text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS season text,
  ADD COLUMN IF NOT EXISTS max_per_season integer,
  ADD COLUMN IF NOT EXISTS repeat_rule text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_code_key;
ALTER TABLE public.achievements ADD CONSTRAINT achievements_code_key UNIQUE (code);

UPDATE public.achievements SET active = false WHERE code IS NULL;

INSERT INTO public.achievements
  (code, name, icon, ability, ability_zh, description, requirement, type, difficulty, reset_cycle, star_reward, seasonal, season, max_per_season, repeat_rule, approval_required, position, active)
VALUES
  ('s1_baller_sales','BALLER SALES','💰','Closing Ability','成交能力','Proof of closing power — the ability to land a heavyweight sale.','Complete a single sale of RM8,000 or above.','Season','Hard','Never',1,true,'S1',NULL,'Unlimited',false,1,true),
  ('s1_top_sales','TOP SALES, PLEASE STEP ASIDE','👑','Sales Consistency','持续销售能力','Proof of sustained performance at the top of the board.','Become Top Sales for the month.','Season','Hard','Monthly',1,true,'S1',3,'Once per month · max 3 stars per season',false,2,true),
  ('s1_thank_you','THANK YOU','❤️','Customer Experience','服务能力','Proof that guests leave better than they arrived.','Accumulate 30 valid customer reviews.','Season','Standard','Monthly',1,true,'S1',3,'Once per month · max 3 stars per season',false,3,true),
  ('s1_nothing_i_cant_sell','NOTHING I CAN’T SELL','🍾','Market Education','教育市场能力','Proof of the ability to educate a market, not just serve it.','Either (A) accumulate 30 sales of designated slow-moving products, OR (B) sell designated Premium products.','Season','Hard','Seasonal',1,true,'S1',1,'Once per season',false,4,true),
  ('s1_viral_again','LOOK AT ME! I''M VIRAL AGAIN!','🎥','Brand Influence','品牌影响力','Proof that your voice carries beyond the shop floor.','During one season, reach 200,000 Reels views OR 2,000 Reels shares.','Season','Hard','Seasonal',1,true,'S1',3,'Max 3 stars per season',false,5,true),
  ('s1_iron_man','I''M IRON MAN','🦾','Discipline','坚持与执行力','Proof of showing up — relentlessly.','Complete 28 Working Days within one month.','Season','Standard','Monthly',1,true,'S1',3,'Monthly · max 3 stars per season',false,6,true),
  ('s1_mentorship','MENTORSHIP','🎓','Leadership','培养人才能力','Proof that you can grow another Hunter, not just yourself.','Successfully recruit 1 new Ambassador and help that new Ambassador complete 10 valid sales.','Season','Epic','Seasonal',1,true,'S1',3,'Max 3 stars per season',false,7,true),
  ('s1_game_changer','GAME CHANGER','🚀','Innovation','创新与改变能力','Proof that you changed the game for everyone behind you.','Create a contribution with significant impact on the company — e.g. a new strategy, marketing initiative, system, or measurable business value.','Season','Legendary','Never',1,true,'S1',NULL,'Council approval required',true,8,true)
ON CONFLICT (code) DO NOTHING;
-- Enable realtime for messages and keep conversation ordering fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation_updated_at ON messages;
CREATE TRIGGER trg_touch_conversation_updated_at
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_updated_at();

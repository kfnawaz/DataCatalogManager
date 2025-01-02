import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

// Custom emojis for metadata context
const customEmojis = [
  {
    id: 'data_quality',
    name: 'Data Quality',
    keywords: ['data', 'quality', 'check'],
    skins: [{ native: '📊' }],
  },
  {
    id: 'data_lineage',
    name: 'Data Lineage',
    keywords: ['lineage', 'flow', 'connection'],
    skins: [{ native: '🔄' }],
  },
  {
    id: 'metadata',
    name: 'Metadata',
    keywords: ['meta', 'data', 'info'],
    skins: [{ native: '📋' }],
  },
  {
    id: 'data_validation',
    name: 'Data Validation',
    keywords: ['valid', 'check', 'verify'],
    skins: [{ native: '✅' }],
  },
  {
    id: 'data_error',
    name: 'Data Error',
    keywords: ['error', 'warning', 'issue'],
    skins: [{ native: '⚠️' }],
  }
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-none" align="start">
        <Picker
          data={data}
          custom={customEmojis}
          onEmojiSelect={onEmojiSelect}
          theme="light"
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}

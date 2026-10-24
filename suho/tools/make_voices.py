# 수호 월드 AI 음성 만들기: suho/voice/lines.json 의 대사를 인물별 목소리(Microsoft Edge 신경망 음성)로 mp3로 만들고
# suho/voice/ready.json 에 "누가|문장" → 파일 목록을 씀. 이미 만든 파일은 건너뜀.
# 실행: pip install edge-tts && python suho/tools/make_voices.py
import asyncio, hashlib, json, os, sys
import edge_tts

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
VOICE_DIR = os.path.join(ROOT, 'voice')
# 인물: (목소리, 음높이, 빠르기)
VOICES = {
    '수호': ('ko-KR-InJoonNeural', '+40Hz', '+5%'),
    '엄마': ('ko-KR-SunHiNeural', '+0Hz', '-5%'),
    '아빠': ('ko-KR-InJoonNeural', '-6Hz', '-5%'),
    '소미누나': ('ko-KR-SunHiNeural', '+30Hz', '+5%'),
    '동원': ('ko-KR-InJoonNeural', '+45Hz', '+8%'),
    '예나': ('ko-KR-SunHiNeural', '+45Hz', '+5%'),
    '시현': ('ko-KR-SunHiNeural', '+38Hz', '+8%'),
    '햇살반선생님': ('ko-KR-SunHiNeural', '+12Hz', '-6%'),
    '햇님반선생님': ('ko-KR-SunHiNeural', '-8Hz', '-8%'),
    '안내': ('ko-KR-SunHiNeural', '+18Hz', '+0%'),
}

async def make(who, text, path):
    voice, pitch, rate = VOICES.get(who, VOICES['안내'])
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, voice, pitch=pitch, rate=rate).save(path)
            if os.path.getsize(path) > 500:
                return True
        except Exception as e:
            print('retry', who, text, e, file=sys.stderr)
        await asyncio.sleep(2 + attempt * 3)
    if os.path.exists(path):
        os.remove(path)
    return False

async def main():
    lines = json.load(open(os.path.join(VOICE_DIR, 'lines.json'), encoding='utf-8'))
    ready = {}
    made = 0
    for who, text in lines:
        key = who + '|' + text
        name = 'v_' + hashlib.md5(key.encode('utf-8')).hexdigest()[:10] + '.mp3'
        path = os.path.join(VOICE_DIR, name)
        if not os.path.exists(path):
            if not await make(who, text, path):
                print('failed', key, file=sys.stderr)
                continue
            made += 1
        ready[key] = 'voice/' + name
    json.dump(ready, open(os.path.join(VOICE_DIR, 'ready.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('made', made, 'ready', len(ready), 'of', len(lines))

asyncio.run(main())

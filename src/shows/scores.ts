import type { Score } from './types';

export const SCORES: Score[] = [
  {
    id: 'night-blade',
    title: '夜雨刀',
    titleEn: 'Blade in the Night Rain',
    lotId: 'stage',
    duration: 36,
    phase: 6,
    lookMode: 'audience',
    groundY: 0.52,
    roles: [
      { id: 'bai', name: '白岚', robe: 0xd7d2c6, pants: 0x243044, hair: 0x1a1a1a, hat: 'ribbon', prop: 'sword', home: [-1.15, 0.15] },
      { id: 'chi', name: '赤卫', robe: 0xa32d2d, pants: 0x2a1614, hair: 0x120c0c, hat: 'cap', prop: 'sword', home: [1.2, 0.05] },
      { id: 'gu', name: '鼓手', robe: 0x35583a, pants: 0x243028, hair: 0x24180f, prop: 'stick', home: [-2.15, -1.35] },
    ],
    lines: [
      { t: 0, role: 'bai', text: '夜雨压城，刀还在鞘里发烫。', en: 'Night rain on the city. The blade is still hot in the sheath.', gesture: 'talk', emotion: 'neutral', x: -0.7, z: 0.4 },
      { t: 5, role: 'chi', text: '名字留在桥上的人，别想干着走回去。', en: 'Leave your name on the bridge, and you will not leave dry.', gesture: 'point', emotion: 'angry', x: 0.85, z: 0.35, look: 'bai' },
      { t: 10, role: 'bai', text: '桥可以让。人，不能让。', en: 'The bridge can yield. A person cannot.', gesture: 'guard', emotion: 'angry', x: -0.15, z: 0.55, look: 'chi' },
      { t: 15, role: 'chi', text: '那就看雨更冷，还是刀更冷。', en: 'Then we learn which is colder — the rain, or the blade.', gesture: 'slash', emotion: 'angry', x: 0.35, z: 0.7, sfx: 'wood', react: 'cheer', look: 'bai' },
      { t: 20, role: 'bai', text: '一刀只为把路切开。', en: 'One cut, only to open the road.', gesture: 'slash', emotion: 'neutral', x: -0.05, z: 0.85, sfx: 'wood', look: 'chi' },
      { t: 25, role: 'gu', text: '（鼓点像雨，落在两人中间。）', en: '(Drums fall like rain between them.)', gesture: 'drum', emotion: 'neutral', sfx: 'drum', react: 'clap' },
      { t: 29, role: 'bai', text: '收刀。雨还在，路还在。', en: 'Sheathe it. The rain remains, and so does the road.', gesture: 'bow', emotion: 'sad', x: -0.8, z: 0.2 },
      { t: 33, role: 'chi', text: '下次换你先出鞘。我在桥上等。', en: 'Next time you draw first. I will be on the bridge.', gesture: 'point', emotion: 'listen', x: 1.15, z: 0.1, look: 'audience' },
    ],
    alts: [
      {
        line: 0,
        options: [
          { text: '夜雨压城，刀还在鞘里发烫。', en: 'Night rain on the city. The blade is still hot in the sheath.', gesture: 'talk', emotion: 'neutral' },
          { text: '风从桥洞里来，先吹灯，再吹人。', en: 'Wind from under the bridge blows the lamps out, then the people.', gesture: 'talk', emotion: 'sad' },
          { text: '这一场不点名。雨认得刀。', en: 'No names tonight. The rain already knows the blade.', gesture: 'raise', emotion: 'neutral' },
        ],
      },
      {
        line: 5,
        options: [
          { text: '（鼓点像雨，落在两人中间。）', en: '(Drums fall like rain between them.)', gesture: 'drum', emotion: 'neutral' },
          { text: '（鼓停半拍，像有人在远处踩水。）', en: '(The drum hesitates, like footsteps in a puddle.)', gesture: 'drum', emotion: 'listen' },
        ],
      },
    ],
  },
  {
    id: 'three-cups',
    title: '三杯茶',
    titleEn: 'Three Cups',
    lotId: 'tea',
    duration: 34,
    phase: 6,
    lookMode: 'group',
    groundY: 0,
    roles: [
      { id: 'cha', name: '阿茶', robe: 0x2f6d62, pants: 0x24342e, hair: 0x3a2418, hat: 'none', home: [0, -0.9] },
      { id: 'ke', name: '客行', robe: 0xc48a3a, pants: 0x3a2e22, hair: 0x1c140e, hat: 'cap', home: [-1.15, 0.75] },
      { id: 'zhou', name: '老周', robe: 0x5c4636, pants: 0x2c241c, hair: 0x888078, hat: 'scholar', prop: 'fan', home: [1.15, 0.7] },
    ],
    lines: [
      { t: 0, role: 'cha', text: '第一杯，洗掉路上的灰。不谈价钱。', en: 'The first cup washes the dust off the road. No talk of price.', gesture: 'offer', emotion: 'happy', look: 'ke' },
      { t: 5, role: 'ke', text: '我只问一句：城里今夜有没有不唱的地方？', en: 'One question: is there anywhere in the city that is not singing tonight?', gesture: 'think', emotion: 'listen', look: 'cha' },
      { t: 10, role: 'zhou', text: '有。你把脚站住的地方，戏就会小声。', en: 'Yes. Wherever your feet decide to stay, the show gets quiet.', gesture: 'talk', emotion: 'happy', look: 'ke' },
      { t: 16, role: 'cha', text: '第二杯，给还没想好去处的人。', en: 'The second cup is for someone who has not chosen a direction.', gesture: 'offer', emotion: 'neutral', look: 'ke' },
      { t: 21, role: 'ke', text: '那第三杯呢？总该有个说法。', en: 'And the third? There ought to be a reason.', gesture: 'talk', emotion: 'surprise', look: 'zhou' },
      { t: 26, role: 'zhou', text: '留给会鼓掌的人。你听，棚外已经有人站住了。', en: 'It is kept for people who clap. Listen — someone outside has already stopped.', gesture: 'point', emotion: 'happy', react: 'clap', look: 'audience' },
      { t: 31, role: 'cha', text: '请慢用。杯子不赶路。', en: 'Take your time. A cup is not in a hurry.', gesture: 'bow', emotion: 'happy', look: 'ke' },
    ],
    alts: [
      {
        line: 2,
        options: [
          { text: '有。你把脚站住的地方，戏就会小声。', en: 'Yes. Wherever your feet decide to stay, the show gets quiet.', gesture: 'talk', emotion: 'happy' },
          { text: '没有。连茶壶都在跟锣鼓。你就当自己是观众。', en: 'No. Even the teapot keeps time. Pretend you bought a ticket.', gesture: 'wave', emotion: 'happy' },
          { text: '城门里没有。茶棚里有半寸。就在这桌子上。', en: 'Not inside the walls. Half a cun of quiet sits on this table.', gesture: 'offer', emotion: 'listen' },
        ],
      },
    ],
  },
  {
    id: 'drum-tale',
    title: '鼓边书',
    titleEn: 'Tale by the Drum',
    lotId: 'market',
    duration: 30,
    phase: 4,
    lookMode: 'audience',
    groundY: 0.08,
    roles: [
      { id: 'shu', name: '说书人', robe: 0x6b3a4a, pants: 0x2a2030, hair: 0x1a120e, hat: 'scholar', prop: 'fan', home: [0.15, 0] },
      { id: 'luo', name: '小锣', robe: 0xd1a15a, pants: 0x3a3024, hair: 0x2a1c12, hat: 'cap', prop: 'stick', home: [-1.05, -0.35] },
    ],
    lines: [
      { t: 0, role: 'shu', text: '今日不讲皇帝。讲一个卖灯的人。', en: 'No emperors today. A person who sold lamps.', gesture: 'talk', emotion: 'happy' },
      { t: 5, role: 'luo', text: '（小锣一击，像灯芯爆了一下。）', en: '(A small gong, like a wick popping.)', gesture: 'drum', emotion: 'happy', sfx: 'wood', react: 'clap' },
      { t: 9, role: 'shu', text: '他每天把灯点得比月亮更早。', en: 'Every day he lit the lamps earlier than the moon.', gesture: 'raise', emotion: 'neutral' },
      { t: 14, role: 'shu', text: '有人问：灯是卖给路，还是卖给心？', en: 'Someone asked: do you sell the lamp to the road, or to the heart?', gesture: 'point', emotion: 'listen' },
      { t: 19, role: 'luo', text: '卖给站住的人！', en: 'To whoever stops walking!', gesture: 'wave', emotion: 'happy', sfx: 'clap', react: 'cheer' },
      { t: 23, role: 'shu', text: '你若站住，这一盏就算你的。不必给钱。', en: 'If you stay, this one is yours. No coins.', gesture: 'offer', emotion: 'happy' },
      { t: 27, role: 'shu', text: '明天还在这条街上。灯不搬家。', en: 'Tomorrow, same street. Lamps do not move house.', gesture: 'bow', emotion: 'listen' },
    ],
    alts: [
      {
        line: 2,
        options: [
          { text: '他每天把灯点得比月亮更早。', en: 'Every day he lit the lamps earlier than the moon.', gesture: 'raise', emotion: 'neutral' },
          { text: '河边的灯会跟着鼓点晃，像有人在水里答话。', en: 'The river lamps sway with the drum, as if the water is answering.', gesture: 'talk', emotion: 'listen' },
          { text: '他不卖最亮的那盏。最亮的留给还没到的人。', en: 'He never sold the brightest one. That was kept for whoever had not arrived.', gesture: 'think', emotion: 'sad' },
        ],
      },
    ],
  },
  {
    id: 'lamp-crane',
    title: '灯下鹤',
    titleEn: 'Crane Behind the Lamp',
    lotId: 'shadow',
    duration: 28,
    phase: 2,
    lookMode: 'audience',
    groundY: 0,
    roles: [
      { id: 'deng', name: '灯师', robe: 0x8a3a22, pants: 0x2a1c14, hair: 0x1a100c, hat: 'cap', prop: 'stick', home: [-2.35, 1.15] },
      { id: 'bai', name: '白叙述', robe: 0xf0e2c8, pants: 0x3a342c, hair: 0x2a1c14, hat: 'scholar', prop: 'fan', home: [2.25, 1.35] },
    ],
    lines: [
      { t: 0, role: 'bai', text: '灯一点，布就成了夜。今晚的客人是一只鹤。', en: 'Light the lamp, and the cloth becomes night. Tonight’s guest is a crane.', gesture: 'present', emotion: 'happy' },
      { t: 5, role: 'deng', text: '鹤不说话。它用翅膀把月亮掀开一条缝。', en: 'The crane does not speak. Its wing lifts a seam in the moon.', gesture: 'raise', emotion: 'listen', sfx: 'wood' },
      { t: 10, role: 'bai', text: '船夫问：你是来渡人，还是来渡光？', en: 'The boatman asks: did you come to ferry people, or to ferry light?', gesture: 'talk', emotion: 'neutral', look: 'deng' },
      { t: 15, role: 'deng', text: '（灯芯爆了一下，鹤低下头。）都渡。只要你站住。', en: '(The wick pops. The crane bows.) Both — if you stay standing.', gesture: 'hush', emotion: 'sad', react: 'clap' },
      { t: 20, role: 'bai', text: '看，影子比人先鞠躬。', en: 'Look — the shadow bows before the person does.', gesture: 'bow', emotion: 'listen', look: 'audience' },
      { t: 24, role: 'deng', text: '下一场还是这盏灯。鹤若回来，替我鼓掌。', en: 'Same lamp next time. If the crane returns, clap for me.', gesture: 'wave', emotion: 'happy', react: 'cheer' },
    ],
    alts: [
      {
        line: 1,
        options: [
          { text: '鹤不说话。它用翅膀把月亮掀开一条缝。', en: 'The crane does not speak. Its wing lifts a seam in the moon.', gesture: 'raise', emotion: 'listen' },
          { text: '今天的鹤腿有点慢。灯不催它。', en: 'Today the crane is a little slow. The lamp does not rush it.', gesture: 'talk', emotion: 'happy' },
          { text: '你若眨眼，鹤就换了一只翅膀。', en: 'Blink, and the crane has switched wings.', gesture: 'flourish', emotion: 'surprise' },
        ],
      },
      {
        line: 4,
        options: [
          { text: '看，影子比人先鞠躬。', en: 'Look — the shadow bows before the person does.', gesture: 'bow', emotion: 'listen' },
          { text: '布上的人没有脸。所以你把自己的脸借给它。', en: 'The figure on the cloth has no face. So you lend it yours.', gesture: 'present', emotion: 'neutral' },
          { text: '船靠岸了。灯还没靠岸。', en: 'The boat has landed. The lamp has not.', gesture: 'point', emotion: 'sad' },
        ],
      },
    ],
  },
  {
    id: 'trial-cut',
    title: '试刃',
    titleEn: 'The Trial Cut',
    lotId: 'field',
    duration: 32,
    phase: 8,
    lookMode: 'group',
    groundY: 0,
    roles: [
      { id: 'guan', name: '试官', robe: 0x2a3148, pants: 0x1c2030, hair: 0x3a3028, hat: 'scholar', home: [0.1, 3.15] },
      { id: 'jia', name: '甲', robe: 0xd7d2c6, pants: 0x243044, hair: 0x1a1a1a, hat: 'ribbon', prop: 'sword', home: [-1.7, 1.55] },
      { id: 'yi', name: '乙', robe: 0xa32d2d, pants: 0x2a1614, hair: 0x140c0c, hat: 'cap', prop: 'sword', home: [1.75, 1.45] },
    ],
    lines: [
      { t: 0, role: 'guan', text: '校场不记名。只记谁先收脚。', en: 'The field keeps no names. Only who recovers their footing first.', gesture: 'talk', emotion: 'neutral' },
      { t: 5, role: 'jia', text: '试刃，不试命。刀口朝外。', en: 'We test the edge, not a life. The edge stays outward.', gesture: 'guard', emotion: 'listen', x: -1.15, z: 1.7, look: 'yi' },
      { t: 9, role: 'yi', text: '那你就进半步。我看你的肩。', en: 'Then take half a step. I am watching your shoulder.', gesture: 'point', emotion: 'angry', x: 1.2, z: 1.65, look: 'jia' },
      { t: 13, role: 'jia', text: '半步到了。', en: 'Half a step.', gesture: 'lunge', emotion: 'neutral', x: -0.25, z: 1.85, sfx: 'wood', look: 'yi' },
      { t: 17, role: 'yi', text: '接住。没响的那一下才算数。', en: 'Caught. The blow that makes no sound is the one that counts.', gesture: 'block', emotion: 'angry', x: 0.45, z: 1.7, sfx: 'wood', react: 'cheer', look: 'jia' },
      { t: 21, role: 'jia', text: '再来。这次换你进。', en: 'Again. Your turn to enter.', gesture: 'slash', emotion: 'neutral', x: -0.55, z: 1.5, look: 'yi' },
      { t: 25, role: 'guan', text: '停。脚还在圈里，刃已经试完。', en: 'Stop. Your feet are still in the ring. The edge has been tested.', gesture: 'raise', emotion: 'happy', react: 'clap' },
      { t: 29, role: 'yi', text: '收势。下一轮，谁先鞠躬谁先选边。', en: 'Recover. Next round, whoever bows first picks a side.', gesture: 'kneel', emotion: 'listen', x: 1.5, z: 1.4, look: 'guan' },
    ],
    alts: [
      {
        line: 0,
        options: [
          { text: '校场不记名。只记谁先收脚。', en: 'The field keeps no names. Only who recovers their footing first.', gesture: 'talk', emotion: 'neutral' },
          { text: '今日不点到。点到的是影子。', en: 'No roll call today. The roll is for the shadows.', gesture: 'point', emotion: 'listen' },
          { text: '尘土比鼓诚实。你踩实了，它才响。', en: 'Dust is more honest than a drum. It only sounds when you commit.', gesture: 'stamp', emotion: 'neutral' },
        ],
      },
      {
        line: 6,
        options: [
          { text: '停。脚还在圈里，刃已经试完。', en: 'Stop. Your feet are still in the ring. The edge has been tested.', gesture: 'raise', emotion: 'happy' },
          { text: '可以了。观众若鼓掌，算你们打平。', en: 'Enough. If the crowd claps, call it a draw.', gesture: 'wave', emotion: 'happy' },
          { text: '收刀。木桩还在，人不必倒。', en: 'Sheathe them. The posts are still standing. People need not fall.', gesture: 'hush', emotion: 'listen' },
        ],
      },
    ],
  },
];

export function scoreById(id: string) {
  const s = SCORES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown score ${id}`);
  return s;
}

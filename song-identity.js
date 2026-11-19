// The homepage and title/artist checker share these song identity rules.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SongIdentity = factory();
  }
})(globalThis, function () {
  function isValidArtist(artist) {
      if (!artist || artist.trim() === '') return false;
      if (artist.includes('来源处未提供标准格式歌手')) return false;
      return true;
  }

  function normalizeString(str) {
      if (!str) return '';
      let s = str.trim();
      // 全角转半角（仅对符号/数字/英文生效，不破坏日语假名）
      s = s.replace(/[\uFF01-\uFF5E]/g, function(ch) {
          return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
      });
      s = s.replace(/\u3000/g, ' ');
      // 统一特殊符号，不修改日语内容
      s = s.replace(/[～〜˜]/g, '~');
      s = s.replace(/[—–―]/g, '-');
      s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      s = s.replace(/…/g, '...');
      // 合并多余空格
      s = s.replace(/\s+/g, ' ');
      return s.toLowerCase();
  }

  const TITLE_CANONICAL_ALIAS_GROUPS = [
    {
      canonical: 'フクロウ~フクロウが知らせる客が来たと~',
      aliases: [
        'フクロウ ～フクロウが知らせる客が来たと～',
        'フクロウ 〜フクロウが知らせる客が来たと〜',
        'フクロウ~フクロウが知らせる客が来たと~',
        'フクロウ～フクロウが知らせる客が来たと～',
        'フクロウ ～フクロウが知らせる客が来たと'
      ]
    },
    {
      canonical: 'secret base ~君がくれたもの~',
      aliases: [
        'secret base ～君がくれたもの～',
        'secret base～君がくれたもの～',
        'secret base 〜君がくれたもの〜',
        'secret base〜君がくれたもの〜',
        'secret base ~君がくれたもの',
        'secret base〜君がくれたもの',
        'secret base～君がくれたもの',
        'Secret base～君がくれたもの～',
        'Secret Base 〜君がくれたもの〜'
      ]
    },
    {
      canonical: 'departures ~あなたにおくるアイの歌~',
      aliases: [
        'Departures ～あなたにおくるアイの歌～',
        'Departures 〜あなたにおくるアイの歌〜',
        'Departures〜あなたにおくるアイの歌〜',
        'Departures 〜あなたにおくるアイの歌',
        'Departures～あなたにおくるアイの歌～',
        'Departures~あなたにおくるアイの歌~',
        'Departures~ あなたにおくるアイの歌~'
      ]
    },
    {
      canonical: '渡月橋~君想ふ~',
      aliases: [
        '渡月橋～君想ふ～',
        '渡月橋 ～君 想ふ～',
        '渡月橋 〜君 想ふ〜',
        '渡月橋～君 想ふ～'
      ]
    },
    {
      canonical: '月陽-ツキアカリ-',
      aliases: ['月陽-ツキアカリ-', '月陽 -ツキアカリ-', '月陽 - ツキアカリ -']
    },
    {
      canonical: '心拍数♯0822',
      aliases: [
        '心拍数♯0822',
        '心拍数#0822',
        '心拍数＃0822',
        '心拍数'
      ]
    },
    {
      canonical: 'ペンパイナッポーアッポーペン(PPAP)',
      aliases: [
        'ペンパイナッポーアッポーペン(PPAP)',
        'PPAP(ペンパイナッポーアッポーペン)',
        'ペンパイナッポーアッポーペン（PPAP）',
        'PPAP（ペンパイナッポーアッポーペン）'
      ]
    },
    {
      canonical: 'butter-fly~tri.version~',
      aliases: ['Butter-Fly ～tri.Version～', 'Butter-Fly~tri.Version~']
    },
    {
      canonical: 'さよならの夏~コクリコ坂から~',
      aliases: [
        'さよならの夏～コクリコ坂から～',
        'さよならの夏 ～コクリコ坂から～',
        'さよならの夏 〜コクリコ坂から〜'
      ]
    },
    {
      canonical: '貴方解剖純愛歌~死ね~',
      aliases: ['貴方解剖純愛歌~死ね~', '貴方解剖純愛歌 ~死ね~', '貴方解剖純愛歌 ～死ね～']
    },
    {
      canonical: 'swallowtail butterfly~あいのうた~',
      aliases: ['Swallowtail Butterfly 〜あいのうた〜', 'Swallowtail Butterfly～あいのうた～']
    },
    {
      canonical: 'eternal wind~ほほえみは光る風の中~',
      aliases: ['ETERNAL WIND ～ほほえみは光る風の中～', 'ETERNAL WIND~ほほえみは光る風の中~']
    },
    {
      canonical: 'let it go~ありのままで~',
      aliases: ['Let It Go ～ありのままで～', 'Let It Go～ありのままで～']
    },
    {
      canonical: '恋におちて-fall in love-',
      aliases: ['恋におちて-Fall in Love-', '恋におちて -Fall in love-']
    },
    {
      canonical: 'time after time~花舞う街で~',
      aliases: ['Time after time 〜花舞う街で〜', 'Time After Time～花舞う街で～']
    },
    {
      canonical: 'falco-ファルコ-',
      aliases: ['Falco-ファルコ-', 'Falco -ファルコ-', 'Falco- ファルコ', 'Falco -ファルコ']
    },
    {
      canonical: 'rain stops, good-bye',
      aliases: ['rain stops, good-bye', 'rain stops,good-bye', 'rain stops, good -bye']
    },
    {
      canonical: 'angelus -アンジェラス',
      aliases: ['ANGELUS -アンジェラス', 'ANGELUS-アンジェラス', 'ANGELUS -アンジェラス-']
    },
    {
      canonical: 'axia~ダイスキでダイキライ~',
      aliases: [
        'AXIA～ダイスキでダイキライ',
        'AXIA ～ダイスキでダイキライ～',
        'AXIA～ダイスキでダイキライ～',
        'AXIA ~ダイスキでダイキライ~',
        'AXIA〜ダイスキでダイキライ〜'
      ]
    },
    {
      canonical: 'don\'t say "lazy"',
      aliases: ['Don\'t say "lazy"', 'Don\'t say lazy', 'Don\'t say “lazy”', 'Don\'t say"lazy"']
    },
    {
      canonical: '津軽海峡・冬景色',
      aliases: ['津軽海峡・冬景色', '津軽海峡冬景色', '津軽海峡･冬景色']
    },
    {
      canonical: '手紙 ~拝啓 十五の君へ~',
      aliases: [
        '手紙 〜拝啓 十五の君へ〜',
        '手紙～拝啓 十五の君へ～',
        '手紙 ～拝啓十五の君へ～',
        '手紙～拝啓  十五の君へ～',
        '手紙～拝啓　十五の君へ～',
        '手紙 ～拝啓 十五の君へ～'
      ]
    },
    {
      canonical: 'ワンルーム・オール・ザット・ジャズ',
      aliases: [
        'ワンルーム・オール・ザット・ジャズ',
        'ワンルームオールザットジャズ',
        'ワンルーム・オール・ザット・ジャズ!'
      ]
    },
    {
      canonical: 'サムライハート(some like it hot!!)',
      aliases: [
        'サムライハート(Some Like It Hot!!)',
        'サムライハート(Some Like It Hot！)',
        'サムライハート(Some Like it Hot!!)',
        'サムライハート(SomeLikeItHot!!)'
      ]
    },
    {
      canonical: 'dear mr「f」',
      aliases: ['Dear. Mr「F」', 'Dear Mr 『F』', 'Dear Mr 「F」']
    },
    {
      canonical: '寝・逃・げでリセット',
      aliases: ['寝・逃・げでリセット', '寝逃げでリセット!', '寝・逃・げでリセット！']
    },
    {
      canonical: 'hello ~paradise kiss~',
      aliases: [
        'HELLO ～Paradise Kiss～',
        'Hello ～ Paradise Kiss',
        'Hello ～ Paradise Kiss～',
        'HELLO 〜Paradise Kiss〜'
      ]
    },
    {
      canonical: 'butter-fly',
      aliases: ['Butter-Fly', 'Butter fly', 'Butter-fly']
    },
    {
      canonical: '1・2・3',
      aliases: ['1・2・3', '１・２・３', '1 2 3']
    },
    {
      canonical: '愛言葉iii',
      aliases: ['愛言葉Ⅲ', '愛言葉III', '愛言葉iii']
    },
    {
      canonical: 'bling-bang-bang-born',
      aliases: ['Bling-Bang-Bang-Born', 'Bling Bang Bang Born']
    },
    {
      canonical: 'first love',
      aliases: ['First Love', 'First love']
    },
    {
      canonical: 'kick back',
      aliases: ['KICK BACK', 'KICKBACK', 'Kick back']
    },
    {
      canonical: 'おジャ魔女カーニバル!!',
      aliases: ['おジャ魔女カーニバル!!', 'おジャ魔女カーニバル！！', 'おジャ魔女カーニバル']
    },
    {
      canonical: 'iris out',
      aliases: ['IRIS OUT', 'IRISOUT', 'IRIS　OUT', 'Iris out']
    },
    {
      canonical: 'night dancer',
      aliases: ['NIGHT DANCER', 'Night Dancer', 'NIGHTDANCER']
    },
    {
      canonical: 'overdose',
      aliases: ['Overdose', 'overdose', 'over dose']
    },
    {
      canonical: '言って。',
      aliases: ['言って。', '言って']
    },
    {
      canonical: 'さよーならまたいつか!',
      aliases: ['さよーならまたいつか！', 'さよーならまたいつか!', 'さよーならまたいつか']
    },
    {
      canonical: '勇気100%',
      aliases: ['勇気100%', '勇気100％']
    },
    {
      canonical: '螺旋',
      aliases: ['螺旋', '螺旋 -RASEN-']
    }
  ];

  const TITLE_CANONICAL_ALIAS_MAP = TITLE_CANONICAL_ALIAS_GROUPS.reduce((map, group) => {
    const canonical = normalizeString(group.canonical);
    [group.canonical, ...(group.aliases || [])].forEach(alias => {
      const normalized = normalizeString(alias);
      if (normalized) map.set(normalized, canonical);
    });
    return map;
  }, new Map());

  function normalizeSongTitleKey(title) {
    const normalized = normalizeString(title || '未知歌曲');
    const canonical = TITLE_CANONICAL_ALIAS_MAP.get(normalized);
    if (canonical) return canonical;
    return normalized;
  }

  function getSongField(songOrTitle, field) {
      if (songOrTitle && typeof songOrTitle === 'object') {
          return songOrTitle[field] || '';
      }
      return field === 'title' ? songOrTitle : '';
  }

  function includesAny(value, needles) {
      return needles.some(needle => value.includes(normalizeString(needle)));
  }

  function isWorldIsMineTitle(titleKey) {
      return titleKey === normalizeString('ワールドイズマイン')
          || titleKey === normalizeString('ワールドイズマインCPK! Remix')
          || titleKey === normalizeString('ワールドイズマイン CPK! Remix');
  }

  function isRayTitle(titleKey) {
      return titleKey === normalizeString('ray')
          || titleKey.includes(normalizeString('ray 超かぐや姫'))
          || titleKey.includes(normalizeString('ray(超かぐや姫'))
          || titleKey.includes(normalizeString('ray (超かぐや姫'))
          || titleKey.includes(normalizeString('ray（超かぐや姫'));
  }

  function normalizeSongIdentityKey(songOrTitle) {
      const titleKey = normalizeSongTitleKey(getSongField(songOrTitle, 'title'));
      const artistKey = normalizeString(getSongField(songOrTitle, 'artist'));
      const originalArtistKey = normalizeString(getSongField(songOrTitle, 'originalArtist'));
      const combined = `${titleKey} ${artistKey} ${originalArtistKey}`;

      if (isWorldIsMineTitle(titleKey)) {
          if (
              titleKey.includes(normalizeString('cpk! remix'))
              || includesAny(combined, ['超かぐや姫', 'かぐや', '月見ヤチヨ', '夏吉ゆうこ', '早見沙織'])
          ) {
              return normalizeString('ワールドイズマインCPK! Remix');
          }
          return normalizeString('ワールドイズマイン');
      }

      if (isRayTitle(titleKey)) {
          if (
              titleKey.includes(normalizeString('超かぐや姫'))
              || includesAny(combined, ['超かぐや姫', 'かぐや', '月見ヤチヨ', '夏吉ゆうこ', '早見沙織'])
          ) {
              return normalizeString('ray（超かぐや姫！Ver.）');
          }
          if (titleKey === normalizeString('ray')) return titleKey;
      }

      return titleKey;
  }

  const TITLE_ARTIST_CANONICAL_ALIAS_GROUPS = [
    {
      title: '今宵はHalloween Night!',
      canonicalArtist: 'hololive IDOL PROJECT',
      aliases: [
        'hololive IDOL PROJECT',
        'ホロライブ',
        'ホロライブ夜空メル紫咲シオン癒月ちょこ潤羽るしあ'
      ]
    }
  ];

  const TITLE_ARTIST_CANONICAL_ALIAS_MAP = TITLE_ARTIST_CANONICAL_ALIAS_GROUPS.reduce((map, group) => {
    const titleKey = normalizeSongIdentityKey(group.title);
    const canonicalArtist = normalizeString(group.canonicalArtist);
    [group.canonicalArtist, ...(group.aliases || [])].forEach(alias => {
      const artistKey = normalizeString(alias);
      if (artistKey) map.set(`${titleKey}\u0000${artistKey}`, canonicalArtist);
    });
    return map;
  }, new Map());

  function normalizeSongArtistIdentityKey(songOrTitle) {
    const titleKey = normalizeSongIdentityKey(songOrTitle);
    const artistKey = normalizeString(getSongField(songOrTitle, 'artist'));
    return TITLE_ARTIST_CANONICAL_ALIAS_MAP.get(`${titleKey}\u0000${artistKey}`) || artistKey;
  }

  const ARTIST_AGNOSTIC_IDENTITY_KEYS = new Set([
      normalizeString('ワールドイズマイン'),
      normalizeString('ワールドイズマインCPK! Remix'),
      normalizeString('ray（超かぐや姫！Ver.）')
  ]);

  function hasContinuousCommonStr(str1, str2, minLength = 2) {
      const s1 = normalizeString(str1);
      const s2 = normalizeString(str2);
      if (s1.length < minLength || s2.length < minLength) return false;
      for (let i = 0; i <= s1.length - minLength; i++) {
          const subStr = s1.substring(i, i + minLength);
          if (s2.includes(subStr)) return true;
      }
      return false;
  }

  function isSameSong(songA, songB) {
      const titleA = normalizeSongIdentityKey(songA);
      const titleB = normalizeSongIdentityKey(songB);
      if (titleA !== titleB) return false;
      if (ARTIST_AGNOSTIC_IDENTITY_KEYS.has(titleA)) return true;

      const artistA = (songA.artist || '').trim();
      const artistB = (songB.artist || '').trim();
      const validA = isValidArtist(artistA);
      const validB = isValidArtist(artistB);

      if (!validA || !validB) return true;

      const normArtistA = normalizeString(artistA);
      const normArtistB = normalizeString(artistB);
      if (normalizeSongArtistIdentityKey(songA) === normalizeSongArtistIdentityKey(songB)) return true;
      return normArtistA === normArtistB || hasContinuousCommonStr(artistA, artistB);
  }

  return { isValidArtist, normalizeString, normalizeSongIdentityKey, normalizeSongArtistIdentityKey, isSameSong };
});

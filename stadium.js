// The stadium shared by the 3D drills: a sky with clouds, a two-deck bowl of stands on every side,
// a crowd in the seats, ad boards, roofs and a video board. Works with three.js r128 and newer.
//
//   const park = qbStadium(THREE, renderer);
//   scene.add(park.sky, park.stadium);           // centre park.stadium on the middle of the field
//   scene.fog = new THREE.Fog(park.haze, 130, 340);
//
// Sizes are in metres. The field runs along z (downfield is -z); the stands sit 31 m either side
// of the middle and 64 m beyond it at each end, so a 120-yard field fits inside.
(function () {
  function qbStadium(THREE, renderer) {
    const HAZE = 0xb4cde6;
    function canvasTexture(width, height, draw) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      draw(canvas.getContext('2d'), width, height);
      const texture = new THREE.CanvasTexture(canvas);
      if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      if (renderer) texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    }
    // A seeded random generator, so the crowd and clouds look the same on every visit.
    function seeded(seed) {
      return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    }
    function roundRect(c, x, y, w, h, r) {
      if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    // ---- Sky ----
    const skyMap = canvasTexture(1024, 512, (c, w, h) => {
      const blue = c.createLinearGradient(0, 0, 0, h / 2);
      blue.addColorStop(0, '#2e69b0');
      blue.addColorStop(0.65, '#74a6d9');
      blue.addColorStop(1, '#b4cde6');
      c.fillStyle = blue;
      c.fillRect(0, 0, w, h / 2);
      c.fillStyle = '#b4cde6';
      c.fillRect(0, h / 2, w, h / 2);
      // Soft clouds, drawn on both edges as well so the sky wraps without a seam.
      const rnd = seeded(7);
      for (let i = 0; i < 34; i++) {
        const x = rnd() * w, y = 80 + rnd() * 150, r = 18 + rnd() * 46;
        for (let k = 0; k < 7; k++) {
          const px = x + (rnd() - 0.5) * r * 2.6, py = y + (rnd() - 0.5) * r * 0.4, pr = r * (0.45 + rnd() * 0.6);
          for (const dx of [-w, 0, w]) {
            c.save();
            c.translate(px + dx, py);
            c.scale(1, 0.42);
            const puff = c.createRadialGradient(0, 0, 0, 0, 0, pr);
            puff.addColorStop(0, 'rgba(255,255,255,.6)');
            puff.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = puff;
            c.fillRect(-pr, -pr, pr * 2, pr * 2);
            c.restore();
          }
        }
      }
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24),
      new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -1;

    // ---- Crowd: four bands of seated and standing fans, mostly in the two teams' colours ----
    const CROWD_BANDS = 4, CROWD_PX = 256, CROWD_H = 1.8;
    const CROWD_TILE = 2048 / (CROWD_PX / CROWD_H);
    const crowdMap = canvasTexture(2048, CROWD_PX * CROWD_BANDS, (c, w) => {
      const rnd = seeded(11);
      const pick = (list) => list[Math.floor(rnd() * list.length)];
      const SHIRTS = ['#1746a8', '#1746a8', '#1746a8', '#1d4ed8', '#143a8c', '#b91c1c', '#b91c1c', '#991b1b',
        '#f1f5f9', '#e5e7eb', '#f8fafc', '#111827', '#374151', '#6b7280', '#facc15', '#0f766e'];
      const SKIN_TONES = ['#f1c7a5', '#e0ac86', '#c68e6a', '#9a6444', '#6f442d', '#4a2c1d'];
      const HAIR = ['#1f1a17', '#2b1d14', '#4a3426', '#8a5a32', '#c9a26b', '#6b7280'];
      const PANTS = ['#1e3a5f', '#1f2937', '#111827', '#a8916b', '#334155'];
      const m = CROWD_PX / CROWD_H;
      const seats = Math.round(w / (0.52 * m)), seat = w / seats;
      const shade = (hex, f) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
      for (let band = 0; band < CROWD_BANDS; band++) {
        const floor = (band + 1) * CROWD_PX - 2;
        const Y = (metres) => floor - metres * m;
        for (let i = 0; i < seats; i++) {
          if (rnd() < 0.06) continue; // an empty seat
          const s = 0.9 + rnd() * 0.18, cx0 = (i + 0.5) * seat + (rnd() - 0.5) * seat * 0.25;
          const standing = rnd() < 0.2, cheering = standing && rnd() < 0.55;
          const shirt = pick(SHIRTS), skin = pick(SKIN_TONES), hair = pick(HAIR), pants = pick(PANTS);
          const hat = rnd() < 0.22 ? pick(['#1746a8', '#b91c1c', '#111827', '#f1f5f9']) : null;
          const finger = cheering && rnd() < 0.15;
          const reach = [0.3 + rnd() * 0.08, 0.3 + rnd() * 0.08];
          const hip = standing ? 0.92 : 0.5, shoulder = (standing ? 1.44 : 0.98) * s;
          const head = shoulder + 0.2 * s;
          const draw = (cx) => {
            const X = (metres) => cx + metres * m;
            if (standing) {
              c.fillStyle = pants;
              c.fillRect(X(-0.17 * s), Y(hip), 0.34 * s * m, hip * m);
            }
            // Arms: raised when cheering, otherwise down by the sides.
            c.strokeStyle = shade(shirt, 0.85);
            c.lineWidth = 0.09 * s * m;
            c.lineCap = 'round';
            [-1, 1].forEach((side, k) => {
              c.beginPath();
              c.moveTo(X(side * 0.19 * s), Y(shoulder - 0.05));
              if (cheering) c.lineTo(X(side * reach[k] * s), Y(shoulder + 0.5 * s));
              else c.lineTo(X(side * 0.24 * s), Y(Math.max(hip, shoulder - 0.48 * s)));
              c.stroke();
              c.fillStyle = finger && side > 0 ? '#facc15' : skin;
              c.beginPath();
              if (cheering) c.arc(X(side * (reach[k] + 0.03) * s), Y(shoulder + 0.53 * s), (finger && side > 0 ? 0.08 : 0.05) * s * m, 0, Math.PI * 2);
              else c.arc(X(side * 0.24 * s), Y(Math.max(hip, shoulder - 0.5 * s)), 0.045 * s * m, 0, Math.PI * 2);
              c.fill();
            });
            // Body, darker towards the waist.
            const body = c.createLinearGradient(0, Y(shoulder), 0, Y(hip));
            body.addColorStop(0, shirt);
            body.addColorStop(1, shade(shirt, 0.7));
            c.fillStyle = body;
            c.beginPath();
            roundRect(c, X(-0.2 * s), Y(shoulder), 0.4 * s * m, (shoulder - hip) * m, 0.08 * m);
            c.fill();
            c.fillStyle = skin;
            c.fillRect(X(-0.045 * s), Y(head - 0.08 * s), 0.09 * s * m, 0.08 * s * m);
            c.beginPath();
            c.ellipse(X(0), Y(head), 0.095 * s * m, 0.115 * s * m, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = hat || hair;
            c.beginPath();
            c.ellipse(X(0), Y(head + 0.035 * s), 0.1 * s * m, 0.085 * s * m, 0, Math.PI, Math.PI * 2);
            c.fill();
            if (hat) c.fillRect(X(-0.13 * s), Y(head + 0.04 * s), 0.26 * s * m, 0.025 * m);
          };
          draw(cx0);
          // Fans on the edge of the tile are drawn on the other edge too, so rows repeat seamlessly.
          if (cx0 < 0.6 * m) draw(cx0 + w);
          if (cx0 > w - 0.6 * m) draw(cx0 - w);
        }
      }
    });
    crowdMap.wrapS = THREE.RepeatWrapping;
    const crowdMaterial = new THREE.MeshLambertMaterial({ map: crowdMap, alphaTest: 0.4, side: THREE.DoubleSide });
    crowdMaterial.alphaToCoverage = true;
    const SEATS = new THREE.MeshLambertMaterial({ color: 0x2c3646 });
    const CONCRETE = new THREE.MeshLambertMaterial({ color: 0x5b616b });
    // Lit a little from below as well, so the roof's shaded underside is not pitch black.
    const STEEL = new THREE.MeshLambertMaterial({ color: 0x4b5563, emissive: 0x262c36 });

    // ---- Text boards: the ads on the front wall and the ribbon board along the upper deck ----
    function boardTexture(width, height, panels) {
      const map = canvasTexture(width, height, (c, w, h) => {
        const step = w / panels.length;
        panels.forEach(([bg, fg, text], i) => {
          c.fillStyle = bg;
          c.fillRect(i * step, 0, step, h);
          c.fillStyle = fg;
          c.font = `bold ${Math.round(h * 0.55)}px Arial`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(text, i * step + step / 2, h / 2 + 2);
        });
      });
      map.wrapS = THREE.RepeatWrapping;
      return map;
    }
    const adMap = boardTexture(2048, 128, [['#1746a8', '#fff', 'QB SENSE'], ['#111827', '#facc15', 'READ THE DEFENSE'],
      ['#b91c1c', '#fff', 'TRAIN YOUR EYES'], ['#f1f5f9', '#1746a8', 'READ & THROW']]);
    const ribbonMap = boardTexture(2048, 64, [['#0b0f17', '#facc15', 'QB SENSE'], ['#0b0f17', '#ffffff', 'FIRST DOWN'],
      ['#0b0f17', '#60a5fa', 'GO BLUE'], ['#0b0f17', '#ffffff', 'MAKE THE READ']]);
    function board(group, map, length, height, tile, y, z) {
      const texture = map.clone();
      texture.needsUpdate = true;
      texture.repeat.x = length / tile;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, height), new THREE.MeshBasicMaterial({ map: texture }));
      mesh.rotation.y = Math.PI;
      mesh.position.set(0, y, z);
      group.add(mesh);
    }

    // ---- One section of stands, in its own frame: x along the stand, z away from the field, y up ----
    const LOWER = { rows: 24, tread: 0.85, riser: 0.42, front: 0, base: 1.8, under: 0 };
    const UPPER = { rows: 22, tread: 0.85, riser: 0.55, front: 17, base: 16, under: 13 };
    function stand(length) {
      const group = new THREE.Group();
      const quads = [];
      for (const tier of [LOWER, UPPER]) {
        const { rows, tread, riser, front, base, under } = tier;
        const back = front + rows * tread, top = base + rows * riser;
        const shape = new THREE.Shape();
        shape.moveTo(front, under);
        shape.lineTo(front, base);
        for (let i = 0; i < rows; i++) {
          shape.lineTo(front + (i + 1) * tread, base + i * riser);
          shape.lineTo(front + (i + 1) * tread, base + (i + 1) * riser);
        }
        shape.lineTo(back, under ? top - 5 : 0);
        const steps = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false }), SEATS);
        steps.rotation.y = -Math.PI / 2;
        steps.position.x = length / 2;
        group.add(steps);
        for (let i = 0; i < rows; i++) quads.push([base + i * riser, front + i * tread + tread * 0.5]);
        // The wall behind the top row.
        const wall = new THREE.Mesh(new THREE.BoxGeometry(length, 6, 0.6), CONCRETE);
        wall.position.set(0, top + 3 - (under ? 0 : 1), back + 0.3);
        group.add(wall);
      }
      // Fans: one strip per row, standing on its step and facing the field.
      const position = [], uv = [], normal = [], index = [];
      const rnd = seeded(Math.round(length * 97));
      quads.forEach(([y, z], i) => {
        const band = Math.floor(rnd() * CROWD_BANDS), u = rnd(), span = length / CROWD_TILE;
        const v0 = 1 - (band + 1) / CROWD_BANDS, v1 = 1 - band / CROWD_BANDS;
        position.push(-length / 2, y, z, length / 2, y, z, length / 2, y + CROWD_H, z, -length / 2, y + CROWD_H, z);
        // Seen from the field, +x is on the viewer's left.
        uv.push(u + span, v0, u, v0, u, v1, u + span, v1);
        for (let k = 0; k < 4; k++) normal.push(0, 0, -1);
        const a = i * 4;
        index.push(a, a + 3, a + 2, a, a + 2, a + 1);
      });
      const crowdGeometry = new THREE.BufferGeometry();
      crowdGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
      crowdGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      crowdGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
      crowdGeometry.setIndex(index);
      group.add(new THREE.Mesh(crowdGeometry, crowdMaterial));
      // Ads along the front wall, the ribbon board on the upper deck, and the roof above it.
      board(group, adMap, length, 1.2, 40, 1.1, -0.02);
      board(group, ribbonMap, length, 2.4, 40, UPPER.under + 1.5, UPPER.front - 0.02);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(length, 0.8, 17), STEEL);
      roof.position.set(0, 36, 32);
      group.add(roof);
      const lights = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff7e0 }));
      lights.position.set(0, 35.5, 24);
      group.add(lights);
      for (let x = -length / 2 + 6; x < length / 2; x += 24) {
        const column = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, 0.6), STEEL);
        column.position.set(x, 32, 38);
        group.add(column);
      }
      return group;
    }

    // ---- The bowl: sideline walls 34 yards from the middle, end walls 10 yards past each end line ----
    const stadium = new THREE.Group();
    const SIDE = 31, END = 64, CORNER = 4;
    for (const [length, angle, x, z] of [
      [2 * END, Math.PI / 2, SIDE, 0], [2 * END, -Math.PI / 2, -SIDE, 0],
      [2 * SIDE, Math.PI, 0, -END], [2 * SIDE, 0, 0, END],
      // The corners are angled sections that join the sides and the ends.
      [32, 3 * Math.PI / 4, SIDE + CORNER, -END - CORNER], [32, -3 * Math.PI / 4, -SIDE - CORNER, -END - CORNER],
      [32, Math.PI / 4, SIDE + CORNER, END + CORNER], [32, -Math.PI / 4, -SIDE - CORNER, END + CORNER],
    ]) {
      const section = stand(length);
      section.rotation.y = angle;
      section.position.set(x, 0, z);
      stadium.add(section);
    }
    // Grass around the field, out to the stands.
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(2 * SIDE + 4, 2 * END + 4), new THREE.MeshLambertMaterial({ color: 0x24502c }));
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.04;
    stadium.add(apron);

    // ---- A video board above the stands behind the far end zone ----
    const screenMap = canvasTexture(512, 256, (c, w, h) => {
      const glow = c.createLinearGradient(0, 0, 0, h);
      glow.addColorStop(0, '#0f2a66');
      glow.addColorStop(1, '#081633');
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#facc15';
      c.fillRect(0, h - 26, w, 26);
      c.fillStyle = '#fff';
      c.font = 'bold 76px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('QB SENSE', w / 2, h / 2 - 14);
      c.font = 'bold 18px Arial';
      c.fillStyle = '#0b0f17';
      c.fillText('READ  •  DECIDE  •  THROW', w / 2, h - 13);
    });
    const videoBoard = new THREE.Group();
    videoBoard.add(new THREE.Mesh(new THREE.BoxGeometry(30, 15, 1.2), STEEL));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(28, 13.5), new THREE.MeshBasicMaterial({ map: screenMap }));
    screen.position.z = 0.62;
    videoBoard.add(screen);
    for (const x of [-9, 9]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 0.8), STEEL);
      leg.position.set(x, -13, 0);
      videoBoard.add(leg);
    }
    videoBoard.position.set(0, 45, -END - 30);
    stadium.add(videoBoard);

    return { stadium, sky, haze: HAZE };
  }
  window.qbStadium = qbStadium;
})();

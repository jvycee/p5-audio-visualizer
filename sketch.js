let mic, fft, amplitude;
let particles = [];
let mode = 0;
let palette;

const PALETTE = {
  sunset: ['#ff5e4d', '#ff8c42', '#ffb347', '#ffd670'],
  cyber: ['#00fff9', '#00d4ff', '#bd00ff', '#ff00e5'],
  dark: ['#0a0a0a', '#1a1a2e', '#16213e', '#0f3460'],
  accent: '#ff5e4d',
  bg: '#0a0a0a'
};

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.size = random(2, 8);
    this.life = 255;
    this.decay = random(1, 3);
    this.color = random(PALETTE.sunset.concat(PALETTE.cyber));
  }

  update(amp) {
    this.x += this.vx * (1 + amp * 3);
    this.y += this.vy * (1 + amp * 3);
    this.life -= this.decay;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  display() {
    noStroke();
    let c = color(this.color);
    c.setAlpha(this.life);
    fill(c);
    ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

class SporeSystem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.branches = [];
    this.maxBranches = 5;
    this.growth = 0;
  }

  grow(spectrum) {
    this.growth += 0.01;

    if (this.branches.length < this.maxBranches && random() < 0.02) {
      let angle = random(TWO_PI);
      let energy = spectrum[floor(random(spectrum.length))];
      this.branches.push({
        angle: angle,
        length: 0,
        maxLength: map(energy, 0, 255, 20, 150),
        thickness: map(energy, 0, 255, 1, 5)
      });
    }

    this.branches.forEach(branch => {
      if (branch.length < branch.maxLength) {
        branch.length += 0.5;
      }
    });
  }

  display() {
    push();
    translate(this.x, this.y);

    this.branches.forEach((branch, i) => {
      push();
      rotate(branch.angle + sin(this.growth + i) * 0.1);

      let c = lerpColor(
        color(PALETTE.sunset[i % PALETTE.sunset.length]),
        color(PALETTE.cyber[i % PALETTE.cyber.length]),
        sin(this.growth) * 0.5 + 0.5
      );
      c.setAlpha(150);
      stroke(c);
      strokeWeight(branch.thickness);
      line(0, 0, branch.length, 0);

      noStroke();
      fill(c);
      ellipse(branch.length, 0, branch.thickness * 2);
      pop();
    });

    pop();
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  fft = new p5.FFT(0.8, 512);
  amplitude = new p5.Amplitude();

  background(PALETTE.bg);
}

async function startAudio() {
  if (!mic) {
    if (typeof require !== 'undefined') {
      try {
        const constraints = {
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop'
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop'
            }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const audioContext = getAudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        mic = new p5.AudioIn();
        mic.stream = stream;
        mic.mediaStream = source;
        mic.enabled = true;

        fft.setInput(mic);
        amplitude.setInput(mic);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.stop();

        console.log('System audio capture started');
      } catch (err) {
        console.error('Error capturing system audio:', err);
        mic = new p5.AudioIn();
        mic.start();
        fft.setInput(mic);
        amplitude.setInput(mic);
      }
    } else {
      mic = new p5.AudioIn();
      mic.start();
      fft.setInput(mic);
      amplitude.setInput(mic);
    }
  }
}

function draw() {
  fill(color(PALETTE.bg + '15'));
  rect(0, 0, width, height);

  if (mic && mic.enabled) {
    let spectrum = fft.analyze();
    let level = amplitude.getLevel();

    switch(mode) {
      case 0:
        drawCherryBlossoms(spectrum, level);
        break;
      case 1:
        drawSnowflakePattern(spectrum, level);
        break;
      case 2:
        drawSporeMold(spectrum, level);
        break;
      case 3:
        drawConversationFlow(spectrum, level);
        break;
    }

    if (level > 0.01 && particles.length < 100) {
      particles.push(new Particle(random(width), random(height)));
    }

    particles = particles.filter(p => {
      p.update(level);
      p.display();
      return !p.isDead();
    });
  }
}

function drawCherryBlossoms(spectrum, level) {
  push();
  translate(width/2, height/2);

  let petals = 8;
  for (let i = 0; i < petals; i++) {
    push();
    rotate(TWO_PI * i / petals + frameCount * 0.001);

    let energy = spectrum[i * 10] || 0;
    let radius = map(energy, 0, 255, 50, 200);

    noFill();
    strokeWeight(0.5);

    for (let j = 0; j < 5; j++) {
      let c = lerpColor(
        color(PALETTE.sunset[j % PALETTE.sunset.length]),
        color(PALETTE.cyber[0]),
        j / 5
      );
      c.setAlpha(100 - j * 20);
      stroke(c);

      beginShape();
      for (let angle = 0; angle < TWO_PI; angle += 0.1) {
        let r = radius * (0.5 + 0.5 * sin(angle * 3 + frameCount * 0.02));
        let x = r * cos(angle);
        let y = r * sin(angle);
        vertex(x, y);
      }
      endShape(CLOSE);
    }

    pop();
  }
  pop();
}

function drawSnowflakePattern(spectrum, level) {
  push();
  translate(width/2, height/2);
  rotate(frameCount * 0.002);

  let branches = 6;
  for (let i = 0; i < branches; i++) {
    push();
    rotate(TWO_PI * i / branches);

    let segmentLength = map(level, 0, 1, 10, 50);
    let segments = min(spectrum.length / 10, 20);

    strokeWeight(2);

    for (let j = 0; j < segments; j++) {
      let energy = spectrum[j * 10] || 0;
      let len = map(energy, 0, 255, 5, segmentLength);

      let c = lerpColor(
        color(PALETTE.cyber[j % PALETTE.cyber.length]),
        color(PALETTE.sunset[0]),
        energy / 255
      );
      c.setAlpha(200 - j * 5);
      stroke(c);

      line(j * segmentLength, 0, j * segmentLength + len, 0);

      if (j % 3 === 0) {
        push();
        translate(j * segmentLength, 0);
        rotate(PI/4);
        line(0, 0, len/2, 0);
        rotate(-PI/2);
        line(0, 0, len/2, 0);
        pop();
      }
    }

    pop();
  }
  pop();
}

let spores = [];

function drawSporeMold(spectrum, level) {
  if (random() < 0.05 && spores.length < 10) {
    spores.push(new SporeSystem(random(width), random(height)));
  }

  spores.forEach(spore => {
    spore.grow(spectrum);
    spore.display();
  });

  if (spores.length > 20) {
    spores.shift();
  }
}

function drawConversationFlow(spectrum, level) {
  push();

  let nodes = 8;
  for (let i = 0; i < nodes; i++) {
    let x = map(i, 0, nodes - 1, 100, width - 100);
    let baseY = height / 2;

    let energy = 0;
    for (let j = i * 10; j < (i + 1) * 10; j++) {
      energy += spectrum[j] || 0;
    }
    energy /= 10;

    let y = baseY + sin(frameCount * 0.02 + i) * map(energy, 0, 255, 10, 100);

    if (i > 0) {
      let prevX = map(i - 1, 0, nodes - 1, 100, width - 100);
      let prevEnergy = 0;
      for (let j = (i - 1) * 10; j < i * 10; j++) {
        prevEnergy += spectrum[j] || 0;
      }
      prevEnergy /= 10;
      let prevY = baseY + sin(frameCount * 0.02 + i - 1) * map(prevEnergy, 0, 255, 10, 100);

      strokeWeight(map(level, 0, 1, 0.5, 3));
      let c = lerpColor(
        color(PALETTE.sunset[i % PALETTE.sunset.length]),
        color(PALETTE.cyber[i % PALETTE.cyber.length]),
        sin(frameCount * 0.01) * 0.5 + 0.5
      );
      c.setAlpha(150);
      stroke(c);

      beginShape();
      noFill();
      for (let t = 0; t <= 1; t += 0.1) {
        let bx = bezierPoint(prevX, prevX + 50, x - 50, x, t);
        let by = bezierPoint(prevY, prevY, y, y, t);
        vertex(bx, by);
      }
      endShape();
    }

    noStroke();
    let nodeColor = color(PALETTE.accent);
    nodeColor.setAlpha(200);
    fill(nodeColor);
    ellipse(x, y, map(energy, 0, 255, 5, 20));
  }

  pop();
}

function switchMode() {
  mode = (mode + 1) % 4;
  background(PALETTE.bg);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(PALETTE.bg);
}
import { BlockLog } from "./Types";

class SNode<K, V> {
  key: K | null;
  value: V | null;
  left: SNode<K, V> | null;
  right: SNode<K, V> | null;
  parent: SNode<K, V> | null;
  empty: boolean;

  constructor(parent: SNode<K, V> | null, k = null, v = null) {
    this.empty = true;
    this.left = null;
    this.right = null;
    this.value = null;
    this.key = null;
    this.parent = parent;
    if (k !== null) {
      this.empty = false;
      this.key = k;
      this.value = v;
      this.left = new SNode(this);
      this.right = new SNode(this);
    }
  }

  setValue(k: K, v: V) {
    if (this.empty) {
      this.empty = false;
      this.key = k;
      this.value = v;
      this.left = new SNode(this);
      this.right = new SNode(this);
    } else {
      this.value = v;
    }
  }
}

class Splay<K, V> {
  root: SNode<K, V>;
  cmp: (a: K, b: K) => number;

  constructor(cmp = Splay.defaultCmp) {
    this.root = new SNode(null);
    this.cmp = cmp;
  }

  isRight(n: SNode<K, V>) {
    if (n.parent === null) return false;
    return n.parent.right === n;
    this;
  }

  rotate(x: SNode<K, V>) {
    if (x === this.root) return;
    const y = x.parent!;
    const z = y.parent;
    const yRight = this.isRight(y);

    if (this.isRight(x)) {
      y.right = x.left;
      x.left!.parent = y;
      x.left = y;
    } else {
      y.left = x.right;
      x.right!.parent = y;
      x.right = y;
    }
    y.parent = x;
    x.parent = z;
    if (z)
      if (yRight) z.right = x;
      else z.left = x;
  }

  splay(x: SNode<K, V>) {
    for (let f = x.parent; f !== null; ) {
      if (f.parent !== null) this.rotate(this.isRight(f) === this.isRight(x) ? f : x);
      this.rotate(x);
      f = x.parent;
    }
    this.root = x;
  }

  insert(k: K, v: V) {
    let cur = this.root;
    while (true) {
      if (cur.empty) {
        cur.setValue(k, v);
        this.splay(cur);
        return cur;
      }
      const t = this.cmp(cur.key!, k);
      if (t === 0) {
        cur.setValue(k, v);
        this.splay(cur);
        return cur;
      }
      if (t < 0) cur = cur.right!;
      else cur = cur.left!;
    }
  }

  query(k: K) {
    let cur = this.root;
    while (cur) {
      if (cur.empty) return null;
      const t = this.cmp(cur.key!, k);
      if (t === 0) {
        this.splay(cur);
        return cur;
      }
      if (t < 0) cur = cur.right!;
      else cur = cur.left!;
    }
    return null;
  }

  queryAndInit(k: K, v: V) {
    const node = this.query(k);
    if (node === null) {
      return this.insert(k, v);
    }
    return node;
  }

  lowerBound(k: K) {
    let cur = this.root;
    while (cur) {
      if (cur.empty) return null;
      const t = this.cmp(cur.key!, k);
      if (t === 0) {
        this.splay(cur);
        return cur;
      }
      if (t < 0) {
        if (cur.right && cur.right.empty) {
          this.splay(cur);
          return this.next(cur.key!);
        }
        cur = cur.right!;
      } else {
        if (cur.left && cur.left.empty) {
          this.splay(cur);
          return cur;
        }
        cur = cur.left!;
      }
    }
    return null;
  }

  prev(k: K) {
    let cur = this.query(k)?.left;
    if (!cur || cur.empty) return null;
    while (cur) {
      if (cur.right!.empty) return cur;
      cur = cur.right;
    }
    return null;
  }

  next(k: K) {
    let cur = this.query(k)?.right;
    if (!cur || cur.empty) return null;
    while (cur) {
      if (cur.left!.empty) return cur;
      cur = cur.left;
    }
    return null;
  }

  nodePrev(n: SNode<K, V>) {
    this.splay(n);
    let cur = n.left;
    if (cur!.empty) return null;
    while (cur) {
      if (cur.right!.empty) return cur;
      cur = cur.right;
    }
    return null;
  }

  nodeNext(n: SNode<K, V>) {
    this.splay(n);
    let cur = n.right;
    if (cur!.empty) return null;
    while (cur) {
      if (cur.left!.empty) return cur;
      cur = cur.left;
    }
    return null;
  }

  begin() {
    let cur = this.root;
    if (cur.empty) return cur;
    while (!cur.left!.empty) cur = cur.left!;
    return cur;
  }

  end() {
    let cur = this.root;
    if (cur.empty) return cur;
    while (!cur.right!.empty) cur = cur.right!;
    return cur;
  }

  static defaultCmp(a: any, b: any) {
    return a - b;
  }
}

class Log {
  data: Splay<number, Splay<number, Map<number, BlockLog>>>;

  constructor(logs: BlockLog[]) {
    this.data = new Splay();
    this.load(logs);
  }

  load(logs: BlockLog[]) {
    logs.forEach((d) => this.insert(d));
  }

  insert(blocklog: BlockLog) {
    const { posX, posY, posZ } = blocklog;
    const treeY = this.data.queryAndInit(posX, new Splay()).value!;
    const mapZ = treeY.queryAndInit(posZ, new Map()).value!;
    mapZ.set(posY, blocklog);
  }

  query(x: number | null = null, y: number | null = null, z: number | null = null) {
    if (x === null) return this;
    const treeY = this.data.query(x)?.value;
    if (y === null || !treeY) return treeY;
    const mapZ = treeY.query(y)?.value;
    if (z === null || !mapZ) return mapZ;
    return mapZ.get(z);
  }

  next(x: number, y = null) {
    if (y === null) return this.data.next(x);
    const treeY = this.data.query(x);
    return treeY?.value?.next(y);
  }

  prev(x: number, y = null) {
    if (y === null) return this.data.prev(x);
    const treeY = this.data.query(x);
    return treeY?.value?.prev(y);
  }

  queryArea(stx: number, edx: number, sty: number, edy: number) {
    const res = [] as BlockLog[];
    let treeY = this.data.lowerBound(stx);
    while (treeY && treeY.key! <= edx) {
      let mapZ = treeY.value!.lowerBound(sty);
      while (mapZ && mapZ.key! <= edy) {
        res.push(...[...mapZ.value!].map((d) => d[1]));
        mapZ = treeY.value!.nodeNext(mapZ);
      }
      treeY = this.data.nodeNext(treeY);
    }
    return res;
  }

  export() {
    const res = [] as BlockLog[];
    let treeY = this.data.begin();
    while (treeY && !treeY.empty) {
      let mapZ = treeY.value!.begin();
      while (mapZ && !mapZ.empty) {
        res.push(...[...mapZ.value!].map((d) => d[1]));
        mapZ = treeY.value!.nodeNext(mapZ)!;
      }
      treeY = this.data.nodeNext(treeY)!;
    }
    return res;
  }
}

export default Log;

// 배경 소품: KayKit (Kay Lousberg, CC0) 3D 모델을 불러와 코드로 만든 자리에 끼워 넣어요
// SomiAssets.place(group, 'city/car_sedan', { fit: ['z', 4.3] }) → 불러오면 group의 원래 모양을 지우고 모델로 바꿔요.
// 못 불러오면(오프라인 등) 원래 코드로 만든 모양이 그대로 남아요.
(function () {
  const loader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  const cache = {};
  function load(name) {
    if (!cache[name]) cache[name] = new Promise((ok, fail) => {
      if (!loader) return fail(new Error('no GLTFLoader'));
      loader.load('assets/kaykit/' + name + '.gltf', g => {
        g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const box = new THREE.Box3().setFromObject(g.scene);
        ok({ scene: g.scene, box, size: box.getSize(new THREE.Vector3()) });
      }, undefined, fail);
    });
    return cache[name];
  }
  // fit: [axis, length] scales the model so that side measures length; the model stands on y = 0, centred on x/z
  function place(group, name, o) {
    o = o || {};
    load(name).then(m => {
      const k = o.fit ? o.fit[1] / m.size[o.fit[0]] : (o.scale || 1);
      const obj = m.scene.clone();
      obj.scale.setScalar(k);
      obj.position.set(-(m.box.min.x + m.box.max.x) / 2 * k, -m.box.min.y * k + (o.y || 0), -(m.box.min.z + m.box.max.z) / 2 * k);
      if (o.ry) { const pivot = new THREE.Group(); pivot.rotation.y = o.ry; pivot.add(obj); group.add(pivot); } else group.add(obj);
      (o.replace || []).forEach(c => c.parent && c.parent.remove(c));
      if (!o.keep) for (let i = group.children.length - 1; i >= 0; i--) { const c = group.children[i]; if (c !== obj && c !== obj.parent) group.remove(c); }
    }).catch(() => {});
    return group;
  }
  window.SomiAssets = { load, place };
})();

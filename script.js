document.getElementById("submit").addEventListener("click", onSubmit)

const width = window.outerWidth * 0.8,
    height = window.outerHeight * 0.8,
    circleSize = 20;

let root, database, selectedUser;

const force = d3.layout.force()
    .linkDistance(setLinkDistance)
    .charge(-360)
    .gravity(0.05)
    .size([width, height])
    .on("tick", tick);

const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

let link = svg.selectAll(".link"),
  node = svg.selectAll(".node");

function setLinkDistance (d) {
  return d.source.nama === selectedUser.nama ? 180 : 60
}

function onSubmit () {
  const name = document.getElementById("nama").value
  findRelation(name)
}

// set database
d3.json("relation.json", function (error, json) {
  if (error) console.log(error)

  database = json
});


function findRelation (name) {
  const users = [...database]
  selectedUser = users.find(user => user.nama.toLowerCase() === name.toLowerCase())
  if (!selectedUser) {
      console.log("user not found")
      return
  }

  let graph = {
      nama: selectedUser.nama,
      size: circleSize * 1.5,
      children: []
  }
  // console.log(graph)
  Object.keys(selectedUser).forEach((key, index) => {
      const childKeys = ["job", "hobi", "status", "stack", "daerah", "sekolah", "kuliah"]
      if (childKeys.includes(key)) {
          const child = { nama: selectedUser[key], size: circleSize / 2, children: filterUsersByKey(key, selectedUser)}
          graph = {...graph, children: [...graph.children, child]}
      }
  })
  root = {...graph}
  update();
}

function filterUsersByKey (key, selectedUser) {
  const users = [...database]
  return users.filter(user => user[key] === selectedUser[key] && user["nama"] !== selectedUser["nama"])
    .map(user => {
      let obj = { id: user.id, nama: user.nama }
      return obj
    })
}

function update() {
  let nodes = flatten(root),
      links = d3.layout.tree().links(nodes);
  // Restart the force layout.
  console.log({nodes, links})
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update links.
  link = link.data(links, function(d) { return d.target.id; });

  link.exit().remove();

  link.enter().insert("line", ".node")
      .attr("class", "link");

  // Update nodes.
  node = node.data(nodes, function(d) { return d.id + "-" + d.nama; });

  node.exit().remove();

  let nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

  nodeEnter.append("circle")
      .attr("r", function(d) { return d.size || circleSize; });

  nodeEnter.append("text")
      .attr("dy", ".35em")
      .text(function(d) { return d.nama; });

  node.select("circle")
      .style("fill", color);
}

function tick () {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function color (d) {
  return d.nama === selectedUser.nama ? "#f53b57" // root node
      : d._children ? "#3182bd" // collapsed package
      : d.children ? "#ffc048" // expanded package
      : "#0be881"; // leaf node
}

function click (d) {
  if (d3.event.defaultPrevented) return;
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

function flatten(root) {
  let nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}
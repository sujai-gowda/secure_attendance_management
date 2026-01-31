import { useState, useMemo, useRef, useLayoutEffect } from "react"
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Position,
  Handle,
  MarkerType,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"
import { ChevronDown, ChevronUp, Info, ArrowUp } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface MerkleTreeVisualizationProps {
  students: string[]
  merkleRoot: string | null
  timestamp: string
  horizontalSpacing?: number
  verticalSpacing?: number
}

interface TreeNode {
  id: string
  hash: string
  studentId?: string
  isLeaf: boolean
  left?: TreeNode
  right?: TreeNode
  level?: number
  index?: number
}

const MAX_VISIBLE_LEAVES = 8

const DEFAULT_HORIZONTAL_SPACING = 250
const DEFAULT_VERTICAL_SPACING = 150

function CustomNode({ data }: { data: any }) {
  const { isRoot, isLeaf, hashPreview, studentId, merkleRoot } = data

  return (
    <div
      className={`relative px-3 py-2.5 rounded-lg border-2 font-mono text-xs transition-shadow hover:shadow-md ${
        isRoot
          ? "bg-primary/20 border-primary text-primary font-semibold min-w-[170px]"
          : isLeaf
          ? "bg-muted/80 border-border min-w-[110px]"
          : "bg-accent/60 border-border/60 min-w-[130px]"
      }`}
    >
      {!isRoot && (
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          style={{ background: "#3b82f6", width: "10px", height: "10px", border: "2px solid white" }}
        />
      )}
      {isRoot ? (
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          style={{ background: "#3b82f6", width: "10px", height: "10px", border: "2px solid white" }}
        />
      ) : !isLeaf && (
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          style={{ background: "#3b82f6", width: "10px", height: "10px", border: "2px solid white" }}
        />
      )}
      {isRoot ? (
        <div className="text-center">
          <div className="text-[11px] font-semibold mb-1 flex items-center justify-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" />
            Merkle Root
          </div>
          <div className="text-[10px] break-all">
            {merkleRoot?.substring(0, 28)}...
          </div>
        </div>
      ) : isLeaf ? (
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground mb-1 truncate">
            {studentId}
          </div>
          <div className="text-[10px]">{hashPreview}...</div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-[10px] mb-1">H({hashPreview}...)</div>
          <div className="text-[9px] text-muted-foreground">Combined hash</div>
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  merkleNode: CustomNode,
}

const MerkleTreeVisualizationInner = ({
  students,
  merkleRoot,
  timestamp,
  horizontalSpacing = DEFAULT_HORIZONTAL_SPACING,
  verticalSpacing = DEFAULT_VERTICAL_SPACING,
}: MerkleTreeVisualizationProps) => {
  const [showFullTree, setShowFullTree] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const hasData = Boolean(students?.length && merkleRoot)

  const hashString = (data: string): string => {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, "0")
  }

  const shouldShowSimplified =
    (students?.length ?? 0) > MAX_VISIBLE_LEAVES && !showFullTree

  const buildTree = (leaves: string[]): TreeNode | null => {
    if (leaves.length === 0) return null

    const leafNodes: TreeNode[] = leaves.map((student) => ({
      id: `leaf-${student}`,
      hash: hashString(`${student}:${timestamp}`),
      studentId: student,
      isLeaf: true,
    }))

    if (leafNodes.length === 1) return leafNodes[0]

    const buildLevel = (currentLevel: TreeNode[]): TreeNode => {
      if (currentLevel.length === 1) return currentLevel[0]

      const nextLevel: TreeNode[] = []
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]
        const right = currentLevel[i + 1] || currentLevel[i]

        const combined = left.hash + right.hash
        const parent: TreeNode = {
          id: `node-${i}-${currentLevel.length}`,
          hash: hashString(combined),
          isLeaf: false,
          left,
          right: currentLevel[i + 1] ? right : undefined,
        }
        nextLevel.push(parent)
      }

      return buildLevel(nextLevel)
    }

    return buildLevel(leafNodes)
  }

  const treeNodesAndEdges = useMemo(() => {
    const displayStudents = hasData
      ? shouldShowSimplified
        ? students!.slice(0, MAX_VISIBLE_LEAVES)
        : students!
      : []
    const root = buildTree(displayStudents)
    if (!root) return { nodes: [], edges: [] }

    const nodesByLevel = new Map<number, TreeNode[]>()
    const nodePositions = new Map<string, { x: number; y: number }>()

    const collectNodesByLevel = (node: TreeNode, level: number = 0): void => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(node)
      node.level = level

      if (node.left) {
        collectNodesByLevel(node.left, level + 1)
      }
      if (node.right && node.right !== node.left) {
        collectNodesByLevel(node.right, level + 1)
      }
    }

    collectNodesByLevel(root)
    const maxLevel = Math.max(...Array.from(nodesByLevel.keys()))

    const leavesLeftToRight: TreeNode[] = []
    const collectLeaves = (n: TreeNode) => {
      if (n.isLeaf) {
        leavesLeftToRight.push(n)
        return
      }
      if (n.left) collectLeaves(n.left)
      if (n.right && n.right !== n.left) collectLeaves(n.right)
    }
    collectLeaves(root)

    const assignPositions = (): void => {
      const leafCount = leavesLeftToRight.length
      const totalLeafWidth = (leafCount - 1) * horizontalSpacing
      const leafStartX = -totalLeafWidth / 2

      leavesLeftToRight.forEach((node, i) => {
        nodePositions.set(node.id, {
          x: leafStartX + i * horizontalSpacing,
          y: maxLevel * verticalSpacing,
        })
      })

      const setParentPosition = (node: TreeNode): void => {
        if (node.isLeaf) return
        const left = node.left!
        const right = node.right && node.right !== node.left ? node.right : null
        if (right) {
          setParentPosition(left)
          setParentPosition(right)
          const lp = nodePositions.get(left.id)!
          const rp = nodePositions.get(right.id)!
          nodePositions.set(node.id, {
            x: (lp.x + rp.x) / 2,
            y: (node.level ?? 0) * verticalSpacing,
          })
        } else {
          setParentPosition(left)
          const cp = nodePositions.get(left.id)!
          const branchOffset = horizontalSpacing * 0.35
          nodePositions.set(node.id, {
            x: cp.x + branchOffset,
            y: (node.level ?? 0) * verticalSpacing,
          })
        }
      }
      setParentPosition(root)
    }

    assignPositions()

    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    const createNodesAndEdges = (node: TreeNode): void => {
      const position = nodePositions.get(node.id)
      if (!position) return

      const hashPreview = node.hash.substring(0, 8)
      const isRoot = node.level === 0
      const isLeaf = node.isLeaf

      flowNodes.push({
        id: node.id,
        type: "merkleNode",
        position,
        data: {
          isRoot,
          isLeaf,
          hashPreview,
          studentId: node.studentId,
          merkleRoot: isRoot ? merkleRoot : undefined,
        },
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        draggable: true,
      })

      if (node.left) {
        const leftPos = nodePositions.get(node.left.id)
        if (leftPos) {
          flowEdges.push({
            id: `edge-${node.left.id}-${node.id}`,
            source: node.left.id,
            target: node.id,
            type: "smoothstep",
            animated: false,
            sourceHandle: "top",
            targetHandle: "bottom",
            style: {
              stroke: "#3b82f6",
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: "#3b82f6",
            },
          })
          createNodesAndEdges(node.left)
        }
      }

      if (node.right && node.right !== node.left) {
        const rightPos = nodePositions.get(node.right.id)
        if (rightPos) {
          flowEdges.push({
            id: `edge-${node.right.id}-${node.id}`,
            source: node.right.id,
            target: node.id,
            type: "smoothstep",
            animated: false,
            sourceHandle: "top",
            targetHandle: "bottom",
            style: {
              stroke: "#3b82f6",
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: "#3b82f6",
            },
          })
          createNodesAndEdges(node.right)
        }
      }
    }

    createNodesAndEdges(root)

    return { nodes: flowNodes, edges: flowEdges }
  }, [
    hasData,
    shouldShowSimplified,
    students,
    merkleRoot,
    timestamp,
    horizontalSpacing,
    verticalSpacing,
  ])

  const [nodes, setNodes, onNodesChange] = useNodesState(treeNodesAndEdges.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(treeNodesAndEdges.edges)
  const lastSyncedKey = useRef<string>("")

  useLayoutEffect(() => {
    if (treeNodesAndEdges.nodes.length === 0) return
    const key = `${showFullTree}-${students?.length ?? 0}-${merkleRoot ?? ""}-${timestamp}`
    if (lastSyncedKey.current === key) return
    lastSyncedKey.current = key
    setNodes(treeNodesAndEdges.nodes)
    setEdges(treeNodesAndEdges.edges)
  }, [
    treeNodesAndEdges.nodes,
    treeNodesAndEdges.edges,
    setNodes,
    setEdges,
    showFullTree,
    students?.length,
    merkleRoot,
    timestamp,
  ])

  if (!hasData) {
    return (
      <EmptyState
        title="No Merkle tree to show"
        description="This block is the genesis block or has no student list. Merkle trees are built from attendance blocks with present students."
        variant="inline"
      />
    )
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Merkle Tree Structure</div>
          {students.length > MAX_VISIBLE_LEAVES && (
            <button
              onClick={() => setShowFullTree(!showFullTree)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {showFullTree ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Simplified
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show Full Tree ({students.length} students)
                </>
              )}
            </button>
          )}
        </div>

        {shouldShowSimplified && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md text-xs">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Simplified View
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  Showing first {MAX_VISIBLE_LEAVES} of {students.length} students.
                  Click "Show Full Tree" to see the complete structure.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative w-full h-[600px] bg-muted/20 rounded-lg border border-border/50" ref={reactFlowWrapper}>
          <style>{`
            .react-flow__edge-path {
              stroke-width: 3 !important;
              stroke: #3b82f6 !important;
              fill: none !important;
            }
            .react-flow__edge.selected .react-flow__edge-path {
              stroke-width: 4 !important;
              stroke: #2563eb !important;
            }
            .react-flow__arrowhead {
              fill: #3b82f6 !important;
            }
            .react-flow__edge-text {
              fill: #3b82f6 !important;
            }
          `}</style>
          <ReactFlow
            key={showFullTree ? "full" : "simplified"}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.4 }}
            minZoom={0.05}
            maxZoom={2}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: {
                stroke: "#3b82f6",
                strokeWidth: 2,
              },
            }}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.isRoot) return "hsl(var(--primary))"
                if (node.data?.isLeaf) return "hsl(var(--muted-foreground))"
                return "hsl(var(--accent))"
              }}
              maskColor="hsl(var(--background) / 0.6)"
            />
          </ReactFlow>
        </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs space-y-2">
        <div className="font-medium flex items-center gap-2">
          <Info className="h-3 w-3" />
          How Merkle Trees Work:
        </div>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
          <li>
            Each student ID is hashed with the block timestamp to create a leaf
            node (bottom)
          </li>
          <li>
            Leaf nodes are paired and their hashes are combined to create parent
            nodes
          </li>
          <li>
            Arrows show the flow: child hashes → parent hash (bottom to top)
          </li>
          <li>
            This process continues until a single root hash is created (top)
          </li>
          <li>
            The root hash represents all {students.length} student
            {students.length !== 1 ? "s" : ""} in the block
          </li>
          <li>
            Any change to student data will change the root hash, detecting
            tampering
          </li>
        </ul>
      </div>

        {students.length <= 20 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <strong>Students in this block:</strong> {students.join(", ")}
          </div>
        )}
    </div>
  )
}

export function MerkleTreeVisualization(props: MerkleTreeVisualizationProps) {
  return (
    <ReactFlowProvider>
      <MerkleTreeVisualizationInner {...props} />
    </ReactFlowProvider>
  )
}

import { useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"

interface MerkleTreeVisualizationProps {
  students: string[]
  merkleRoot: string | null
  timestamp: string
}

const MAX_VISIBLE_LEAVES = 8

export function MerkleTreeVisualization({ students, merkleRoot, timestamp }: MerkleTreeVisualizationProps) {
  const [showFullTree, setShowFullTree] = useState(false)

  if (!students || students.length === 0 || !merkleRoot) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No Merkle tree (Genesis block or no students)
      </div>
    )
  }

  const hashString = (data: string): string => {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  const shouldShowSimplified = students.length > MAX_VISIBLE_LEAVES && !showFullTree
  const displayStudents = shouldShowSimplified 
    ? students.slice(0, MAX_VISIBLE_LEAVES)
    : students

  const buildTreeLevels = (leaves: string[]): string[][] => {
    const levels: string[][] = [leaves]
    let currentLevel = leaves

    while (currentLevel.length > 1) {
      const nextLevel: string[] = []
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(`H(${currentLevel[i].substring(0, 4)} + ${currentLevel[i + 1].substring(0, 4)})`)
        } else {
          nextLevel.push(`H(${currentLevel[i].substring(0, 4)})`)
        }
      }
      levels.push(nextLevel)
      currentLevel = nextLevel
    }

    return levels
  }

  const hashedStudents = displayStudents.map(student => 
    hashString(`${student}:${timestamp}`)
  )
  const treeLevels = buildTreeLevels(hashedStudents)

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

      <div className="space-y-4">
        {treeLevels.slice().reverse().map((level, levelIndex) => {
          const reversedIndex = treeLevels.length - 1 - levelIndex
          const isRoot = reversedIndex === treeLevels.length - 1
          const isLeaf = reversedIndex === 0
          
          return (
            <div key={reversedIndex} className="relative">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {level.map((node, nodeIndex) => (
                  <div
                    key={nodeIndex}
                    className={`px-3 py-2 rounded-md border-2 font-mono text-xs ${
                      isRoot
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : isLeaf
                        ? "bg-muted border-border"
                        : "bg-accent/50 border-border"
                    }`}
                  >
                    {isRoot ? (
                      <div className="text-center min-w-[140px]">
                        <div className="font-semibold text-[10px] mb-1">Merkle Root</div>
                        <div className="text-[10px] break-all">{merkleRoot.substring(0, 20)}...</div>
                      </div>
                    ) : isLeaf ? (
                      <div className="text-center min-w-[100px]">
                        <div className="text-[10px] text-muted-foreground mb-1 truncate max-w-[80px]">
                          {displayStudents[nodeIndex]}
                        </div>
                        <div className="text-[10px]">{node}</div>
                      </div>
                    ) : (
                      <div className="text-center min-w-[120px]">
                        <div className="text-[10px]">{node}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!isLeaf && (
                <div className="flex justify-center mt-2">
                  <div className="h-4 w-0.5 bg-border" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs space-y-2">
        <div className="font-medium flex items-center gap-2">
          <Info className="h-3 w-3" />
          How Merkle Trees Work:
        </div>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
          <li>Each student ID is hashed with the block timestamp to create a leaf node</li>
          <li>Leaf nodes are paired and their hashes are combined to create parent nodes</li>
          <li>This process continues until a single root hash is created</li>
          <li>The root hash represents all {students.length} student{students.length !== 1 ? "s" : ""} in the block</li>
          <li>Any change to student data will change the root hash, detecting tampering</li>
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

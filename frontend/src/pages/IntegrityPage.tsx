import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  Hash,
  Calendar,
  Users,
  BookOpen,
} from "lucide-react";
import { apiService, type BlockchainStats } from "@/services/api";
import { MerkleTreeVisualization } from "@/components/blockchain/MerkleTreeVisualization";

interface IntegrityResult {
  result: string;
  is_valid: boolean;
  timestamp: string;
}

interface Block {
  index: number;
  hash: string;
  prev_hash: string;
  timestamp: string;
  merkle_root?: string | null;
  data: any;
}

export default function IntegrityPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [integrityResult, setIntegrityResult] =
    useState<IntegrityResult | null>(null);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [showMerkleTree, setShowMerkleTree] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrityData, statsData, blocksData] = await Promise.all([
        apiService.checkIntegrity(),
        apiService.getStats(),
        apiService.getAllBlocks().catch((err) => {
          console.error("Failed to load blocks:", err);
          return [];
        }),
      ]);

      setIntegrityResult(integrityData);
      setStats(statsData);

      if (blocksData && Array.isArray(blocksData) && blocksData.length > 0) {
        setBlocks(blocksData);
      } else if (statsData) {
        const allBlocks: Block[] = [];
        if (statsData.genesis_block) {
          allBlocks.push(statsData.genesis_block);
        }
        if (statsData.latest_block && statsData.latest_block.index !== 0) {
          allBlocks.push(statsData.latest_block);
        }
        setBlocks(allBlocks);
        if (allBlocks.length < (statsData.total_blocks || 0)) {
          toast({
            title: "Warning",
            description: `Only showing ${allBlocks.length} of ${statsData.total_blocks} blocks. API may not be returning all blocks.`,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check integrity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = (index: number) => {
    setExpandedBlocks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleMerkleTree = (index: number) => {
    setShowMerkleTree((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Hash copied to clipboard",
    });
  };

  const formatHash = (hash: string, length: number = 12) => {
    if (!hash) return "N/A";
    if (hash.length <= length * 2) return hash;
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check Integrity</h1>
        <p className="text-muted-foreground mt-2">
          Verify blockchain integrity and detect any tampering
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Integrity Status
          </CardTitle>
          <CardDescription>
            Cryptographic verification of blockchain data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : integrityResult ? (
            <>
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  integrityResult.is_valid
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                }`}
              >
                {integrityResult.is_valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      integrityResult.is_valid
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {integrityResult.result}
                  </p>
                  {integrityResult.timestamp && (
                    <p
                      className={`text-xs mt-1 ${
                        integrityResult.is_valid
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      Checked at:{" "}
                      {new Date(integrityResult.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {!integrityResult.is_valid && (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Blockchain integrity check failed. The data may have been
                    tampered with or corrupted.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Unable to check integrity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Blocks:</span>
                <span className="font-medium">{stats.total_blocks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Attendance Blocks:
                </span>
                <span className="font-medium">{stats.attendance_blocks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="font-medium">
                  {stats.total_attendance_records}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Block</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.latest_block ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Index:</span>
                    <span className="font-mono">
                      {stats.latest_block.index}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hash:</span>
                    <span className="font-mono text-xs break-all">
                      {formatHash(stats.latest_block.hash || "")}
                    </span>
                  </div>
                  {stats.latest_block.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span className="text-xs">
                        {new Date(
                          stats.latest_block.timestamp
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No blocks available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Blockchain</CardTitle>
            <CardDescription>
              All {blocks.length} block{blocks.length !== 1 ? "s" : ""} in the chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blocks
                .sort((a, b) => a.index - b.index)
                .map((block, idx) => {
                  const isExpanded = expandedBlocks.has(block.index);
                  const showMerkle = showMerkleTree.has(block.index);
                  const isGenesis = block.index === 0;
                  const blockType =
                    block.data?.type === "attendance"
                      ? "Attendance"
                      : "Genesis";
                  const isLast = idx === blocks.length - 1;
                  const studentCount = block.data?.present_students?.length || 0;

                  return (
                    <div key={block.index} className="relative">
                      {!isLast && (
                        <div className="absolute left-5 top-14 w-0.5 h-6 bg-primary/20" />
                      )}
                      <div
                        className={`border rounded-lg transition-all ${
                          isGenesis
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-card hover:bg-accent/30"
                        }`}
                      >
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => toggleBlock(block.index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  isGenesis
                                    ? "bg-primary/20 text-primary"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {isGenesis ? (
                                  <Shield className="h-5 w-5" />
                                ) : (
                                  <LinkIcon className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm">
                                    Block #{block.index}
                                  </h3>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                                      isGenesis
                                        ? "bg-primary/10 text-primary"
                                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {blockType}
                                  </span>
                                  {!isGenesis && studentCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {studentCount} student{studentCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    <span className="font-mono">
                                      {formatHash(block.hash, 8)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(block.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {block.data?.course && (
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      <span className="truncate max-w-[120px]">
                                        {block.data.course}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBlock(block.index);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t pt-4 px-3 pb-3 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Hash:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="font-mono text-xs break-all flex-1">
                                    {block.hash}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(block.hash)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {!isGenesis && (
                                <div>
                                  <span className="text-muted-foreground">Prev Hash:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="font-mono text-xs break-all flex-1">
                                      {block.prev_hash}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(block.prev_hash)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {block.merkle_root && (
                                <div>
                                  <span className="text-muted-foreground">Merkle Root:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="font-mono text-xs break-all flex-1">
                                      {block.merkle_root}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(block.merkle_root || "")}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Timestamp:</span>
                                <div className="mt-1 text-xs">
                                  {new Date(block.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {block.data?.type === "attendance" && (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Teacher</div>
                                    <div className="text-sm font-medium">
                                      {block.data.teacher_name || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Course</div>
                                    <div className="text-sm font-medium">
                                      {block.data.course || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Date</div>
                                    <div className="text-sm font-medium">
                                      {block.data.date || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <Users className="h-3 w-3 inline mr-1" />
                                      Students
                                    </div>
                                    <div className="text-sm font-medium">
                                      {studentCount}
                                    </div>
                                  </div>
                                </div>

                                {block.merkle_root && studentCount > 0 && (
                                  <div className="pt-3 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleMerkleTree(block.index)}
                                      className="w-full mb-3"
                                    >
                                      {showMerkle ? "Hide" : "Show"} Merkle Tree Visualization
                                    </Button>
                                    {showMerkle && (
                                      <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                                        <MerkleTreeVisualization
                                          students={block.data.present_students || []}
                                          merkleRoot={block.merkle_root}
                                          timestamp={block.timestamp}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

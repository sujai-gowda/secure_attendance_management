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
} from "lucide-react";
import { apiService, type BlockchainStats } from "@/services/api";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrityData, statsData, blocksData] = await Promise.all([
        apiService.checkIntegrity(),
        apiService.getStats(),
        apiService.getAllBlocks().catch(() => []),
      ]);

      setIntegrityResult(integrityData);
      setStats(statsData);

      if (blocksData && blocksData.length > 0) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Hash copied to clipboard",
    });
  };

  const handleRecheck = async () => {
    await loadData();
    toast({
      title: "Success",
      description: "Integrity check completed",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

              <Button
                onClick={handleRecheck}
                variant="outline"
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                Re-check Integrity
              </Button>
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
                      {stats.latest_block.hash?.substring(0, 32)}...
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
              View all blocks in the blockchain chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blocks
                .sort((a, b) => a.index - b.index)
                .map((block, idx) => {
                  const isExpanded = expandedBlocks.has(block.index);
                  const isGenesis = block.index === 0;
                  const blockType =
                    block.data?.type === "attendance"
                      ? "Attendance"
                      : "Genesis";
                  const isLast = idx === blocks.length - 1;

                  return (
                    <div key={block.index} className="relative">
                      {!isLast && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-primary/30" />
                      )}
                      <div
                        className={`border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors ${
                          isGenesis
                            ? "border-primary/50 bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`mt-1 p-2 rounded-full ${
                                isGenesis
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isGenesis ? (
                                <Shield className="h-4 w-4" />
                              ) : (
                                <LinkIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  Block #{block.index}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    isGenesis
                                      ? "bg-primary/10 text-primary"
                                      : "bg-blue-500/10 text-blue-500"
                                  }`}
                                >
                                  {blockType}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[100px]">
                                    Hash:
                                  </span>
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
                                {!isGenesis && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground min-w-[100px]">
                                      Prev Hash:
                                    </span>
                                    <code className="font-mono text-xs break-all flex-1">
                                      {block.prev_hash}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        copyToClipboard(block.prev_hash)
                                      }
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[100px]">
                                    Timestamp:
                                  </span>
                                  <span className="text-xs">
                                    {new Date(block.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBlock(block.index)}
                            className="ml-2"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Block Data:
                              </h4>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                {JSON.stringify(block.data, null, 2)}
                              </pre>
                            </div>
                            {block.data?.type === "attendance" && (
                              <div className="grid gap-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Teacher:
                                  </span>
                                  <span className="font-medium">
                                    {block.data.teacher_name || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Course:
                                  </span>
                                  <span className="font-medium">
                                    {block.data.course || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Date:
                                  </span>
                                  <span className="font-medium">
                                    {block.data.date || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Students Present:
                                  </span>
                                  <span className="font-medium">
                                    {block.data.present_students?.length || 0}
                                  </span>
                                </div>
                              </div>
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

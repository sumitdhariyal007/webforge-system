import { NodeSSH } from "node-ssh";
import * as fs from "fs";
import * as path from "path";

export interface DeployConfig {
  local_folder: string;
  ssh_host: string;
  ssh_port?: number;
  ssh_user: string;
  remote_path: string;
  ssh_key_path?: string;
  ssh_password?: string;
}

export interface ListConfig {
  ssh_host: string;
  ssh_port?: number;
  ssh_user: string;
  remote_path: string;
  ssh_key_path?: string;
  ssh_password?: string;
}

interface UploadResult {
  file: string;
  status: "success" | "error";
  message: string;
}

function getConnectionConfig(config: DeployConfig | ListConfig): any {
  const connConfig: any = {
    host: config.ssh_host,
    port: config.ssh_port || 22,
    username: config.ssh_user,
  };
  if (config.ssh_key_path) {
    connConfig.privateKeyPath = config.ssh_key_path;
  } else if (config.ssh_password) {
    connConfig.password = config.ssh_password;
  } else {
    // Try default SSH key
    const defaultKey = path.join(process.env.HOME || "", ".ssh", "id_rsa");
    if (fs.existsSync(defaultKey)) {
      connConfig.privateKeyPath = defaultKey;
    }
  }
  return connConfig;
}

function getAllFiles(dir: string, baseDir?: string): string[] {
  baseDir = baseDir || dir;
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  return files;
}

export async function deployToHosting(config: DeployConfig): Promise<{
  total_files: number;
  successful: number;
  failed: number;
  results: UploadResult[];
}> {
  if (!fs.existsSync(config.local_folder)) {
    throw new Error(`Local folder not found: ${config.local_folder}`);
  }

  const ssh = new NodeSSH();
  const results: UploadResult[] = [];

  try {
    const connConfig = getConnectionConfig(config);
    await ssh.connect(connConfig);

    // Ensure remote directory exists
    await ssh.execCommand(`mkdir -p ${config.remote_path}`);

    const files = getAllFiles(config.local_folder);

    for (const relPath of files) {
      const localPath = path.join(config.local_folder, relPath);
      const remotePath = path.posix.join(config.remote_path, relPath);
      const remoteDir = path.posix.dirname(remotePath);

      try {
        // Ensure remote subdirectory exists
        await ssh.execCommand(`mkdir -p ${remoteDir}`);
        await ssh.putFile(localPath, remotePath);
        results.push({ file: relPath, status: "success", message: `Uploaded to ${remotePath}` });
      } catch (err: any) {
        results.push({ file: relPath, status: "error", message: err.message });
      }
    }
  } catch (err: any) {
    throw new Error(`SSH connection failed: ${err.message}`);
  } finally {
    ssh.dispose();
  }

  const successful = results.filter((r) => r.status === "success").length;
  return {
    total_files: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
}

export async function listHostingFiles(config: ListConfig): Promise<{
  path: string;
  listing: string;
  file_count: number;
}> {
  const ssh = new NodeSSH();

  try {
    const connConfig = getConnectionConfig(config);
    await ssh.connect(connConfig);

    const result = await ssh.execCommand(`ls -la ${config.remote_path}`);
    if (result.stderr && !result.stdout) {
      throw new Error(result.stderr);
    }

    const lines = result.stdout.split("\n").filter((l) => l.trim());
    const fileCount = lines.filter((l) => !l.startsWith("total") && !l.startsWith("d")).length;

    return {
      path: config.remote_path,
      listing: result.stdout,
      file_count: Math.max(0, lines.length - 1), // subtract header
    };
  } catch (err: any) {
    throw new Error(`SSH operation failed: ${err.message}`);
  } finally {
    ssh.dispose();
  }
}

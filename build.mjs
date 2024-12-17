import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['./src/server.ts'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: 'build',
    platform: 'node',
    target: ['node16'],
    format: 'cjs',
    tsconfig: './tsconfig.json',
    logLevel: 'info',
  })
  .catch(() => process.exit(1))

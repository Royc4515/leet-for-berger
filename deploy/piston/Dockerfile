# Piston API image for an Arm (or x86-64) VM, built from source at a pinned commit.
#
# Why not ghcr.io/engineer-man/piston: it is published for x86-64 only, and its base images are
# Debian buster, whose package mirrors are archived. This follows Piston's own api/Dockerfile at the
# same commit, on Debian bookworm and Node 22, every base image pinned by digest.
# Changes from upstream, all here so they stay visible:
#   - the JSON body limit goes from body-parser's 100 kB default to 64 MB (a submit carries the
#     15 cases as stdin, up to about 12 MB);
#   - GCC 12 (Debian bookworm) is installed for the C and C++ runtimes (packages/gcc/12.2.0).

# Piston (MIT) at this commit: https://github.com/engineer-man/piston
ARG PISTON_COMMIT=de2b365ac759670a3a0d13ea208a0869a92c7e64
# isolate, the sandbox Piston uses (cgroup v2 fork), at the commit Piston's Dockerfile pins.
ARG ISOLATE_COMMIT=af6db68042c3aa0ded80787fbb78bc0846ea2114

FROM buildpack-deps:bookworm@sha256:f53cd4c58cdb96a467b98696cd510a949ef4ccd7d23e07b75107de754773007a AS isolate
ARG ISOLATE_COMMIT
RUN apt-get update && \
    apt-get install -y --no-install-recommends git libcap-dev && \
    rm -rf /var/lib/apt/lists/* && \
    git clone https://github.com/envicutor/isolate.git /tmp/isolate/ && \
    cd /tmp/isolate && \
    git checkout "$ISOLATE_COMMIT" && \
    make -j"$(nproc)" install && \
    rm -rf /tmp/*

# The full Node image has git and a compiler: two of Piston's dependencies come from git and one
# builds a native addon. node_modules is copied into the slim image below (same Node, same arch).
FROM node:22.21.1-bookworm@sha256:b84d52cd45bfe261096ccbf886955d431b8b9ed01b72eaef588e8886bda09e78 AS source
ARG PISTON_COMMIT
RUN git clone https://github.com/engineer-man/piston.git /src && \
    cd /src && \
    git checkout "$PISTON_COMMIT" && \
    grep -q "app.use(body_parser.json());" api/src/index.js && \
    sed -i "s/app.use(body_parser.json());/app.use(body_parser.json({ limit: '64mb' }));/" api/src/index.js && \
    cd api && npm ci --omit=dev --no-audit --no-fund

FROM node:22.21.1-bookworm-slim@sha256:25b3eb23a00590b7499f2a2ce939322727fcce1b15fdd69754fcd09536a3ae2c
ENV DEBIAN_FRONTEND=noninteractive
RUN dpkg-reconfigure -p critical dash
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates curl tar gzip xz-utils coreutils util-linux procps locales \
      libcap2 libc6-dev binutils make gcc-12 g++-12 gcc g++ libicu72 zlib1g && \
    rm -rf /var/lib/apt/lists/*
RUN useradd -M piston
COPY --from=isolate /usr/local/bin/isolate /usr/local/bin
COPY --from=isolate /usr/local/etc/isolate /usr/local/etc/isolate
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

WORKDIR /piston_api
COPY --from=source /src/api/package.json /src/api/package-lock.json ./
COPY --from=source /src/api/node_modules ./node_modules
COPY --from=source /src/api/src ./src
RUN chmod +x ./src/docker-entrypoint.sh

CMD ["/piston_api/src/docker-entrypoint.sh"]
EXPOSE 2000/tcp

# =====================================================
# Stage 1: Builder
# =====================================================
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies for SQLite (cgo)
RUN apk add --no-cache gcc musl-dev

# Download dependencies first (layer cache)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with CGO enabled for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o devops-manager main.go

# =====================================================
# Stage 2: Runtime
# =====================================================
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates for SSH connections
RUN apk add --no-cache ca-certificates openssh-client

# Copy the compiled binary
COPY --from=builder /app/devops-manager .

# Copy initialization scripts
COPY scripts/ ./scripts/

# Create directory for SSH keys and data
RUN mkdir -p /app/data /root/.ssh

EXPOSE 8080

CMD ["./devops-manager"]

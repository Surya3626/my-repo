# AWS EKS Production Deployment Guide

This guide provides step-by-step instructions to containerize your unified DevTrack application (React frontend + Spring Boot backend) and deploy it to Amazon Elastic Kubernetes Service (EKS).

## Prerequisites
1. **AWS CLI** configured (`aws configure`).
2. **Docker** installed and running on your local machine.
3. **kubectl** and **eksctl** installed.
4. An active **AWS EKS Cluster** (e.g., `devtrack-cluster`).

---

## Step 1: Containerize the Application

We will build the application and package the single artifact (`.jar`) into a Docker image.

### 1. Build the Unified Artifact
Run the following inside the `devtrack-react/backend` directory. This will build both the frontend and the backend.
```bash
mvn clean install
```
This generates `target/backend-0.0.1-SNAPSHOT.jar`.

### 2. Create the Dockerfile
Create a file named `Dockerfile` in the `devtrack-react/backend` directory:
```dockerfile
FROM eclipse-temurin:21-jre-alpine
VOLUME /tmp
ARG JAR_FILE=target/backend-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

---

## Step 2: Push Image to AWS Elastic Container Registry (ECR)

### 1. Create the ECR Repository
```bash
aws ecr create-repository --repository-name devtrack-app --region us-east-1
```
*(Replace `us-east-1` with your targeted AWS region)*

### 2. Authenticate Docker with ECR
Retrieve the login command to use to authenticate your Docker client to your registry:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### 3. Build, Tag, and Push the Docker Image
```bash
docker build -t devtrack-app .

docker tag devtrack-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/devtrack-app:latest

docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/devtrack-app:latest
```

---

## Step 3: Deploy to Kubernetes (AWS EKS)

Create a deployment file named `devtrack-k8s.yaml` with the following configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devtrack-deployment
  labels:
    app: devtrack
spec:
  replicas: 2
  selector:
    matchLabels:
      app: devtrack
  template:
    metadata:
      labels:
        app: devtrack
    spec:
      containers:
      - name: devtrack
        image: <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/devtrack-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        imagePullPolicy: Always
---
apiVersion: v1
kind: Service
metadata:
  name: devtrack-service
spec:
  type: LoadBalancer
  selector:
    app: devtrack
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

### Apply the Configuration
Ensure your `kubectl` context is set to your EKS cluster:
```bash
aws eks --region us-east-1 update-kubeconfig --name devtrack-cluster
```

Deploy the application:
```bash
kubectl apply -f devtrack-k8s.yaml
```

---

## Step 4: Verify Deployment

1. Check that the pods are running natively inside the cluster:
```bash
kubectl get pods
```

2. Retrieve the public URL for your LoadBalancer to access your DevTrack application hosted on the web:
```bash
kubectl get services devtrack-service
```
Copy the **EXTERNAL-IP** (e.g., `a123bcdefg-456789.us-east-1.elb.amazonaws.com`) and paste it into your browser. You should see the DevTrack Login Screen.

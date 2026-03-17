# CareerPlus-ai

This project is a cloud-native full-stack application deployed on AWS EC2, designed to demonstrate system integration, scalable architecture, and production-level deployment practices. The application is containerized using Docker, enabling consistent and isolated environments for both development and deployment. A multi-stage Docker build was used to efficiently package the backend service, ensuring optimized image size and performance.

The system architecture leverages Nginx as a reverse proxy server to manage incoming client requests and route them appropriately between frontend and backend services. API requests are directed to the backend service, while user interface requests are served by the frontend application. This setup enables seamless communication between services, efficient request handling, and improved scalability of the application.

To enhance system reliability and observability, monitoring was implemented using Prometheus and Grafana. Prometheus is used to collect real-time metrics related to API performance and system health, while Grafana provides interactive dashboards for visualizing these metrics. This allows for proactive detection of issues, performance bottlenecks, and overall system monitoring in a production-like environment.

Overall, the project reflects practical experience in cloud deployment, containerization, web server configuration, and monitoring, demonstrating the ability to design and manage scalable and reliable systems in real-world scenarios.

## Deployment Access (For Demonstration)
The EC2 instance was accessed using SSH with key-based authentication:
ssh -i <private-key>.pem ubuntu@<ec2-public-ip>

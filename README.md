# Braintree Drop-in Demo

A simple Flask app demonstrating Braintree Drop-in integration for payments.

## Features

- Braintree Drop-in UI for card payments
- Provided sandbox test cards and negative testing info for ease of testing (available at the UI sidebar)
- Total amount can be modified

## Requirements

- Python 3.7+
- [pip](https://pip.pypa.io/en/stable/)
- (Optional) [virtualenv](https://virtualenv.pypa.io/en/latest/)

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/braintree-dropin-demo.git
   cd braintree-dropin-demo
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app:**
   ```bash
   python application.py
   ```

5. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```